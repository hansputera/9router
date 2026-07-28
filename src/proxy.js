import { clerkMiddleware } from "@clerk/nextjs/server";
import { proxy as dashboardProxy } from "./dashboardGuard";

export default clerkMiddleware(async (auth, request) => {
  // We still run the old dashboardGuard logic first because it contains
  // custom logic for CLI token validation, local loopback checks, etc.
  // The dashboardGuard handles its own redirecting for /login vs /dashboard.
  return dashboardProxy(request, auth);
});

export const config = {
  matcher: [
    // Next.js standard matcher for middleware
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
    // Clerk explicit matchers
    "/(api|trpc)(.*)",
  ],
};