import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = [
  "/dashboard",
  "/semester",
  "/documents",
  "/planner",
  "/ask",
  "/practice",
  "/analytics",
  "/settings",
  "/onboarding",
];

/**
 * Lightweight guard: redirect to /login only when there's clearly no session
 * cookie at all. Real validation happens in the (app) layout. This does NO
 * network calls so navigation stays instant.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTECTED.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const cookies = request.cookies.getAll();
  const hasSession =
    request.cookies.get("cm_demo")?.value === "1" ||
    cookies.some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
