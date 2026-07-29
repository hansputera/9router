import { auth } from "@/auth";
import { proxy as dashboardProxy } from "./dashboardGuard";

const authEnabled = !!(process.env.AUTH_SECRET || process.env.AUTH_GITHUB_ID || process.env.AUTH_GOOGLE_ID);

export default async function middleware(request) {
  if (authEnabled) {
    const session = await auth();
    return dashboardProxy(request, session);
  }
  return dashboardProxy(request, null);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
    "/(api|trpc)(.*)",
  ],
};
