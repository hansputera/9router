import { getToken } from "next-auth/jwt";
import { proxy as dashboardProxy } from "./dashboardGuard";

const authEnabled = !!(process.env.AUTH_SECRET || process.env.AUTH_GITHUB_ID || process.env.AUTH_GOOGLE_ID);

export default async function middleware(request) {
  if (authEnabled) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    const session = token ? {
      user: {
        id: token.id,
        name: token.name,
        email: token.email,
        image: token.picture,
        orgId: token.orgId,
        orgRole: token.orgRole,
        orgName: token.orgName,
      },
      expires: null,
    } : null;
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
