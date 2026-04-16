import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAllowedAdminEmail } from "@/lib/admin-allowlist";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return isAllowedAdminEmail(user.email);
    },
    // Invoked by proxy (NextAuth wrapper) for every /admin/* request.
    // Re-check allowlist so removed emails lose access without waiting for JWT expiry.
    authorized({ auth: session }) {
      return isAllowedAdminEmail(session?.user?.email);
    },
  },
  session: { strategy: "jwt" },
});
