import { auth } from "@/lib/auth";

// Use NextAuth's auth function as middleware.
// The `authorized` callback in lib/auth.ts controls access:
// unauthenticated requests to /admin/* are redirected to sign-in.
export default auth;

export const config = {
  matcher: ["/admin/:path*"],
};
