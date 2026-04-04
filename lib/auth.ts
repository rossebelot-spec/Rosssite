import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const allowedEmail = process.env.ALLOWED_EMAIL;
      if (!allowedEmail) return false;
      return user.email === allowedEmail;
    },
    authorized({ auth: session }) {
      return !!session?.user;
    },
  },
  session: { strategy: "jwt" },
});
