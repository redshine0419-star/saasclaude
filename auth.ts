import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, profile }) {
      if (profile?.email) {
        token.role = adminEmails.includes(profile.email as string) ? 'admin' : 'user';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = (token.role as string) ?? 'user';
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});
