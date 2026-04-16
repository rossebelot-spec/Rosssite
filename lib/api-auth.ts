import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { isAllowedAdminEmail } from "@/lib/admin-allowlist";

/**
 * `/api/admin/*` and other privileged routes: require a session whose email is in
 * `ALLOWED_ADMIN_EMAILS` (same as `requireAdmin()` / proxy `authorized`).
 */
export async function requireApiSession(): Promise<
  { session: Session } | { response: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!isAllowedAdminEmail(session.user.email)) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session };
}
