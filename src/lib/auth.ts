import { AuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import DiscordProvider from 'next-auth/providers/discord';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';

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

        if (!user || !user.passwordHash) {
          // Create audit log for failed login attempt (user not found) if it's not a USER
          if (user?.role && user.role !== 'USER') {
            await createAuditLog({
              adminId: user.id,
              action: AuditAction.FAILED_LOGIN,
              targetType: AuditTargetType.USER,
              targetId: user.id,
              details: {
                email: credentials.email,
                reason: 'user_not_found_or_no_password',
                role: user.role,
              },
            });
          }
          return null;
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
          }
          return null;
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
      // Allow OAuth signins
      if (account?.provider !== 'credentials') {
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
