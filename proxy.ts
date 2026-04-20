import { auth } from "@/lib/auth";
import {
  NextResponse,
  type NextFetchEvent,
  type NextMiddleware,
  type NextRequest,
} from "next/server";

const CANONICAL_HOST = "www.rossbelot.com";

/** True when `pathname` is exactly `/admin` or starts with `/admin/` (admin UI and nested routes). */
function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

const runNextAuthMiddleware = auth as unknown as NextMiddleware;

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const rawHost = request.headers.get("host") ?? "";
  const hostname = rawHost.split(":")[0] ?? "";

  if (hostname.endsWith(".vercel.app")) {
    const url = request.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  if (isAdminPath(request.nextUrl.pathname)) {
    return runNextAuthMiddleware(request, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * All routes except Next.js internals and favicon (standard middleware pattern).
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
