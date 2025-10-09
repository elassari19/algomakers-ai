import { AuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import DiscordProvider from 'next-auth/providers/discord';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditTargetType, createEventLog } from '@/lib/audit';
import { AUTH_ERRORS, getErrorCategory } from './constant-errors';

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
          await createEventLog({
            userId: 'null',
            eventType: 'FAILED_LOGIN',
            metadata: {
              email: credentials.email,
              reason: 'account_not_found',
            },
          });
          throw new Error(AUTH_ERRORS.ACCOUNT_NOT_FOUND);
        }

        if (!user.passwordHash) {
          await createEventLog({
            userId: user.id,
            eventType: 'FAILED_LOGIN',
            metadata: {
              email: credentials.email,
              reason: 'no_password_set',
            },
          });
          throw new Error(JSON.stringify({
            error: AUTH_ERRORS.INVALID_CREDENTIALS,
            code: 'INVALID_CREDENTIALS',
            category: getErrorCategory(AUTH_ERRORS.INVALID_CREDENTIALS),
          }));
        }

        // Check user status - reject if not active
        if (user.status !== 'ACTIVE') {
          // Create audit log for failed login attempt (inactive user) if it's not a USER
          if (user.role !== 'USER') {
            await createAuditLog({
              adminId: user.id,
              action: AuditAction.FAILED_LOGIN,
              targetType: AuditTargetType.USER,
              targetId: user.id,
              details: {
                email: user.email,
                reason: `user_status_${user.status?.toLowerCase()}`,
                status: user.status,
                role: user.role,
              },
            });
          } else {
            await createEventLog({
              userId: user.id,
              eventType: 'FAILED_LOGIN',
              metadata: {
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
              errorObj = {
                error: AUTH_ERRORS.ACCOUNT_SUSPENDED,
                code: 'ACCOUNT_SUSPENDED',
                category: getErrorCategory(AUTH_ERRORS.ACCOUNT_SUSPENDED),
              };
              break;
            case 'INACTIVE':
              errorObj = {
                error: AUTH_ERRORS.ACCOUNT_INACTIVE,
                code: 'ACCOUNT_INACTIVE',
                category: getErrorCategory(AUTH_ERRORS.ACCOUNT_INACTIVE),
              };
              break;
            case 'DELETED':
              errorObj = {
                error: AUTH_ERRORS.ACCOUNT_DELETED,
                code: 'ACCOUNT_DELETED',
                category: getErrorCategory(AUTH_ERRORS.ACCOUNT_DELETED),
              };
              break;
            case 'UNVERIFIED':
              errorObj = {
                error: AUTH_ERRORS.ACCOUNT_UNVERIFIED,
                code: 'ACCOUNT_UNVERIFIED',
                category: getErrorCategory(AUTH_ERRORS.ACCOUNT_UNVERIFIED),
              };
              break;
            default:
              errorObj = {
                error: AUTH_ERRORS.ACCOUNT_INACTIVE,
                code: 'ACCOUNT_INACTIVE',
                category: getErrorCategory(AUTH_ERRORS.ACCOUNT_INACTIVE),
              };
          }
          throw new Error(JSON.stringify(errorObj));
        }

        // Check email verification - require verification for login
        if (!user.emailVerified) {
          // Create audit log for failed login attempt (unverified email) if it's not a USER
          if (user.role !== 'USER') {
            await createAuditLog({
              adminId: user.id,
              action: AuditAction.FAILED_LOGIN,
              targetType: AuditTargetType.USER,
              targetId: user.id,
              details: {
                email: user.email,
                reason: 'email_not_verified',
                role: user.role,
              },
            });
          } else {
            await createEventLog({
              userId: user.id,
              eventType: 'FAILED_LOGIN',
              metadata: {
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
          if (user.role !== 'USER') {
            await createAuditLog({
              adminId: user.id,
              action: AuditAction.FAILED_LOGIN,
              targetType: AuditTargetType.USER,
              targetId: user.id,
              details: {
                email: user.email,
                reason: 'invalid_password',
                role: user.role,
              },
            });
          } else {
            await createEventLog({
              userId: user.id,
              eventType: 'FAILED_LOGIN',
              metadata: {
                email: credentials.email,
                reason: 'invalid_password',
              },
            });
          }
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
              adminId: user.id,
              action: AuditAction.FAILED_LOGIN,
              targetType: AuditTargetType.USER,
              targetId: user.id,
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
              errorObj = {
                error: AUTH_ERRORS.ACCOUNT_SUSPENDED,
                code: 'ACCOUNT_SUSPENDED',
                category: getErrorCategory(AUTH_ERRORS.ACCOUNT_SUSPENDED),
              };
              break;
            case 'INACTIVE':
              errorObj = {
                error: AUTH_ERRORS.ACCOUNT_INACTIVE,
                code: 'ACCOUNT_INACTIVE',
                category: getErrorCategory(AUTH_ERRORS.ACCOUNT_INACTIVE),
              };
              break;
            case 'DELETED':
              errorObj = {
                error: AUTH_ERRORS.ACCOUNT_DELETED,
                code: 'ACCOUNT_DELETED',
                category: getErrorCategory(AUTH_ERRORS.ACCOUNT_DELETED),
              };
              break;
            case 'UNVERIFIED':
              errorObj = {
                error: AUTH_ERRORS.ACCOUNT_UNVERIFIED,
                code: 'ACCOUNT_UNVERIFIED',
                category: getErrorCategory(AUTH_ERRORS.ACCOUNT_UNVERIFIED),
              };
              break;
            default:
              errorObj = {
                error: AUTH_ERRORS.ACCOUNT_INACTIVE,
                code: 'ACCOUNT_INACTIVE',
                category: getErrorCategory(AUTH_ERRORS.ACCOUNT_INACTIVE),
              };
          }
          throw new Error(JSON.stringify(errorObj));
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
          } else {
            // Create audit log for failed OAuth login (unverified email) if it's not a USER
            if (fullUser.role !== 'USER') {
              await createAuditLog({
                adminId: user.id,
                action: AuditAction.FAILED_LOGIN,
                targetType: AuditTargetType.USER,
                targetId: user.id,
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
      // Log the sign-in event (existing Event model)
      if (user.id) {
        await prisma.event.create({
          data: {
            userId: user.id,
            eventType: 'USER_SIGN_IN',
            metadata: {
              provider: account?.provider,
              isNewUser,
            },
          },
        });

        // Get user role to determine if audit log should be created
        const userWithRole = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        // Create audit log only for non-USER roles
        if (userWithRole?.role && userWithRole.role !== 'USER') {
          await createAuditLog({
            adminId: user.id,
            action: AuditAction.LOGIN,
            targetType: AuditTargetType.USER,
            targetId: user.id,
            details: {
              provider: account?.provider || 'credentials',
              isNewUser: isNewUser || false,
              email: user.email,
              role: userWithRole.role,
            },
          });
        }
      }
    },
    async createUser({ user }) {
      // Log the user creation event (existing Event model)
      if (user.id) {
        await prisma.event.create({
          data: {
            userId: user.id,
            eventType: 'USER_CREATED',
            metadata: {
              email: user.email,
              name: user.name,
            },
          },
        });

        // Get user role to determine if audit log should be created
        const userWithRole = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        // Create audit log only for non-USER roles (OAuth users default to USER role)
        if (userWithRole?.role && userWithRole.role !== 'USER') {
          await createAuditLog({
            adminId: user.id,
            action: AuditAction.CREATE_USER,
            targetType: AuditTargetType.USER,
            targetId: user.id,
            details: {
              email: user.email,
              name: user.name,
              method: 'oauth',
              role: userWithRole.role,
            },
          });
        }
      }
    },
  },
};
