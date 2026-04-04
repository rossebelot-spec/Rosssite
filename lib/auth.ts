import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Read fresh on each invocation — avoids module-load-time evaluation issues
      const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (allowed.length === 0) return false;
      return allowed.includes((user.email ?? "").toLowerCase());
    },
    // authorized() is invoked by middleware.ts for every /admin/* request.
    // Returns false → NextAuth redirects to sign-in automatically.
    authorized({ auth: session }) {
      return !!session?.user;
    },
  },
  session: { strategy: "jwt" },
});
