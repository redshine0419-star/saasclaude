import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

export type UserRole = 'platform_admin' | 'owner' | 'staff' | 'anon';

const PLATFORM_ADMIN_EMAILS = new Set(
  (process.env.PLATFORM_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.role = PLATFORM_ADMIN_EMAILS.has(user.email)
          ? 'platform_admin'
          : 'staff'; // will be refined to owner/staff by membership lookup per-request
      }
      return token;
    },
    async session({ session, token }) {
      if (token.email) {
        session.user.email = token.email as string;
        session.user.role = (token.role as UserRole) ?? 'anon';
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }
}
