import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /merchant and /merchant/* except /merchant/login
  if (pathname.startsWith("/merchant") && !pathname.startsWith("/merchant/login")) {
    const cookieHeader = request.headers.get("cookie") || "";
    const hasAuthToken =
      cookieHeader.includes("revora-auth-token=") ||
      cookieHeader.includes("sb-access-token=") ||
      cookieHeader.includes("sb-jijvjdaittwczuzczxqc-auth-token=");

    if (!hasAuthToken) {
      const loginUrl = new URL("/merchant/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/merchant", "/merchant/:path*"],
};
