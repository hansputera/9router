import { proxy as dashboardProxy } from "./dashboardGuard";

const clerkKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
let clerkInit = null;

async function getClerkMiddleware() {
  if (!clerkKey) return null;
  if (clerkInit) return clerkInit;
  try {
    const { clerkMiddleware } = await import("@clerk/nextjs/server");
    clerkInit = clerkMiddleware(async (auth, request) => {
      return dashboardProxy(request, auth);
    });
  } catch (e) {
    console.error("[proxy] Clerk middleware init failed:", e.message);
    clerkInit = null;
  }
  return clerkInit;
}

export default async function middleware(request) {
  const clerk = await getClerkMiddleware();
  if (clerk) return clerk(request);
  return dashboardProxy(request, null);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
    "/(api|trpc)(.*)",
  ],
};
