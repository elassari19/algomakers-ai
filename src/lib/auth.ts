import { AuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import DiscordProvider from 'next-auth/providers/discord';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { AuditAction, AuditTargetType, createAuditLog } from '@/lib/audit';
import { AUTH_ERRORS, getErrorCategory } from './constant-errors';
import { Role } from '@/generated/prisma';

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          await createAuditLog({
            actorId: 'null',
            actorRole: Role.USER,
            action: AuditAction.FAILED_LOGIN,
            targetType: AuditTargetType.USER,
            responseStatus: 'FAILURE',
            details: {
              email: credentials.email,
              reason: 'account_not_found',
            },
          });
          throw new Error(AUTH_ERRORS.ACCOUNT_NOT_FOUND);
        }

        if (!user.passwordHash) {
          await createAuditLog({
            actorId: user.id,
            actorRole: user.role,
            action: AuditAction.FAILED_LOGIN,
            targetType: AuditTargetType.USER,
            targetId: user.id,
            responseStatus: 'FAILURE',
            details: {
              email: user.email,
              reason: 'no_password_set',
              role: user.role,
            },
          });
          throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
        }

        // Check user status - reject if not active
        if (user.status !== 'ACTIVE') {
          // Create audit log for failed login attempt (inactive user) if it's not a USER
          if (user.role !== 'USER') {
            await createAuditLog({
              actorId: user.id,
              actorRole: user.role,
              action: AuditAction.FAILED_LOGIN,
              targetType: AuditTargetType.USER,
              targetId: user.id,
              responseStatus: 'FAILURE',
              details: {
                email: user.email,
                reason: `user_status_${user.status?.toLowerCase()}`,
                status: user.status,
                role: user.role,
              },
            });
          } else {
            await createAuditLog({
              actorId: user.id,
              actorRole: user.role,
              action: AuditAction.FAILED_LOGIN,
              targetType: AuditTargetType.USER,
              targetId: user.id,
              responseStatus: 'FAILURE',
              details: {
                email: credentials.email,
                reason: `user_status_${user.status?.toLowerCase()}`,
                status: user.status,
              },
            });
          }
          // Return specific error messages based on status
          let errorObj;
          switch (user.status) {
            case 'SUSPENDED':
               errorObj = AUTH_ERRORS.ACCOUNT_SUSPENDED;
              break;
            case 'INACTIVE':
              errorObj = AUTH_ERRORS.ACCOUNT_INACTIVE;
              break;
            case 'DELETED':
              errorObj = AUTH_ERRORS.ACCOUNT_DELETED;
              break;
            case 'UNVERIFIED':
              errorObj = AUTH_ERRORS.ACCOUNT_UNVERIFIED;
              break;
            default:
              errorObj = AUTH_ERRORS.ACCOUNT_INACTIVE;
          }
          throw new Error(errorObj);
        }

        // Check email verification - require verification for login
        if (!user.emailVerified) {
          // Create audit log for failed login attempt (unverified email) if it's not a USER
          if (user.role !== 'USER') {
            await createAuditLog({
              actorId: user.id,
              actorRole: user.role,
              action: AuditAction.FAILED_LOGIN,
              targetType: AuditTargetType.USER,
              targetId: user.id,
              responseStatus: 'FAILURE',
              details: {
                email: user.email,
                reason: 'email_not_verified',
                role: user.role,
              },
            });
          } else {
            await createAuditLog({
              actorId: user.id,
              actorRole: user.role,
              action: AuditAction.FAILED_LOGIN,
              targetType: AuditTargetType.USER,
              targetId: user.id,
              responseStatus: 'FAILURE',
              details: {
                email: credentials.email,
                reason: 'email_not_verified',
              },
            });
          }
          throw new Error(JSON.stringify({
            error: AUTH_ERRORS.EMAIL_NOT_VERIFIED,
            code: 'EMAIL_NOT_VERIFIED',
            category: getErrorCategory(AUTH_ERRORS.EMAIL_NOT_VERIFIED),
          }));
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          // Create audit log for failed login attempt (invalid password) if it's not a USER
          await createAuditLog({
              actorId: user.id,
              actorRole: user.role,
              action: AuditAction.FAILED_LOGIN,
              targetType: AuditTargetType.USER,
              targetId: user.id,
              responseStatus: 'FAILURE',
              details: {
                email: user.email,
                reason: 'invalid_password',
                role: user.role,
              },
            });
          throw new Error(JSON.stringify({
            error: AUTH_ERRORS.INVALID_CREDENTIALS,
            code: 'INVALID_CREDENTIALS',
            category: getErrorCategory(AUTH_ERRORS.INVALID_CREDENTIALS),
          }));
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          tradingviewUsername: user.tradingviewUsername ?? undefined,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role;
        token.tradingviewUsername = (user as any).tradingviewUsername;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.tradingviewUsername = token.tradingviewUsername as string;
      }
      return session;
    },
  async signIn({ user, account, profile }) {
      // For OAuth providers, we still need to check user status and email verification
  if (account?.provider !== 'credentials') {
        // Get the full user data to check status and email verification
        const fullUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { 
            status: true, 
            emailVerified: true, 
            role: true,
            email: true 
          },
        });

        if (!fullUser) {
          return false;
        }

        // Check user status - reject if not active
        if (fullUser.status !== 'ACTIVE') {
          // Create audit log for failed OAuth login (inactive user) if it's not a USER
          if (fullUser.role !== 'USER') {
            await createAuditLog({
              actorId: user.id,
              actorRole: fullUser.role,
              action: AuditAction.FAILED_LOGIN,
              targetType: AuditTargetType.USER,
              targetId: user.id,
              responseStatus: 'FAILURE',
              details: {
                email: fullUser.email,
                reason: `oauth_user_status_${fullUser.status?.toLowerCase()}`,
                status: fullUser.status,
                provider: account?.provider,
                role: fullUser.role,
              },
            });
          }
          // Throw specific error messages based on status for OAuth
          let errorObj;
          switch (fullUser.status) {
            case 'SUSPENDED':
              errorObj = AUTH_ERRORS.ACCOUNT_SUSPENDED;
              break;
            case 'INACTIVE':
              errorObj = AUTH_ERRORS.ACCOUNT_INACTIVE;
              break;
            case 'DELETED':
              errorObj = AUTH_ERRORS.ACCOUNT_DELETED;
              break;
            case 'UNVERIFIED':
              errorObj = AUTH_ERRORS.ACCOUNT_UNVERIFIED;
              break;
            default:
              errorObj = AUTH_ERRORS.ACCOUNT_INACTIVE;
          }
          throw new Error(errorObj);
        }

        // Check email verification for OAuth (some OAuth providers auto-verify)
        if (!fullUser.emailVerified) {
          // For OAuth providers like Google, we can auto-verify the email if the provider confirms it
          if (account?.provider === 'google' && fullUser?.emailVerified) {
            // Auto-verify email for Google OAuth
            await prisma.user.update({
              where: { id: user.id },
              data: { emailVerified: new Date() },
            });
            await createAuditLog({
              actorId: user.id,
              actorRole: fullUser.role,
              action: AuditAction.EMAIL_VERIFIED,
              targetType: AuditTargetType.USER,
              targetId: user.id,
              responseStatus: 'SUCCESS',
              details: {
                email: fullUser.email,
                method: 'google_oauth_auto_verify',
                provider: account?.provider,
                role: fullUser.role,
              },
            });
          } else {
            // Create audit log for failed OAuth login (unverified email) if it's not a USER
            if (fullUser.role !== 'USER') {
              await createAuditLog({
                actorId: user.id,
                actorRole: fullUser.role,
                action: AuditAction.FAILED_LOGIN,
                targetType: AuditTargetType.USER,
                targetId: user.id,
                responseStatus: 'FAILURE',
                details: {
                  email: fullUser.email,
                  reason: 'oauth_email_not_verified',
                  provider: account?.provider,
                  role: fullUser.role,
                },
              });
            }
            throw new Error(JSON.stringify({
              error: AUTH_ERRORS.EMAIL_NOT_VERIFIED,
              code: 'EMAIL_NOT_VERIFIED',
              category: getErrorCategory(AUTH_ERRORS.EMAIL_NOT_VERIFIED),
            }));
          }
        }

        return true;
      }

      // For credentials, user is already validated in authorize
      return true;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log the sign-in event using the unified audit log
      if (user.id) {
        // Get user role for audit log
        const userWithRole = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        const role = userWithRole?.role || 'USER';
        await createAuditLog({
          actorId: user.id,
          actorRole: role,
          action: AuditAction.LOGIN,
          targetType: AuditTargetType.USER,
          targetId: user.id,
          responseStatus: 'SUCCESS',
          details: {
            provider: account?.provider || 'credentials',
            isNewUser: isNewUser || false,
            email: user.email,
            role,
          },
        });
      }
    },
    async createUser({ user }) {
      // Log the user creation event using the unified audit log
      if (user.id) {
        // Get user role for audit log
        const userWithRole = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        const role = userWithRole?.role || 'USER';
        await createAuditLog({
          actorId: user.id,
          actorRole: role,
          action: AuditAction.CREATE_USER,
          targetType: AuditTargetType.USER,
          targetId: user.id,
          responseStatus: 'SUCCESS',
          details: {
            email: user.email,
            name: user.name,
            method: 'oauth',
            role,
          },
        });
      }
    },
  },
};
