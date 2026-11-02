import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// First layer of protection for admin PAGES. It is only a quick gate:
// every admin page and API route verifies the session again on the server.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page must always be reachable, otherwise nobody could ever log in (and we would loop).
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && (await verifySessionToken(token))) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

// Only admin pages. API routes are not matched here: they check the session themselves.
export const config = { matcher: ["/admin", "/admin/:path*"] };