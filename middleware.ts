import { NextResponse, type NextRequest } from "next/server";

function hasSupabaseSession(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"),
    );
}

export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname.startsWith("/login");
  const authenticated = hasSupabaseSession(request);

  if (!authenticated && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (authenticated && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
