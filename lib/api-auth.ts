import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

/**
 * `/api/admin/*` routes sit outside the proxy `/admin` matcher — each handler must
 * authenticate. Returns a 401 response or the session.
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
  return { session };
}
