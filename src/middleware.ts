import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const hasSession =
    request.cookies.get("sb-access-token");

  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/users") ||
    request.nextUrl.pathname.startsWith("/products");

  if (isProtected && !hasSession) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*",
    "/products/:path*",
  ],
};
