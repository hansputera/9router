import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { getAdapter } from "@/lib/db/driver";

const providers = [
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
    ? GitHub({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET })
    : null,
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })
    : null,
].filter(Boolean);

export const authOptions = {
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/sign-in",
    signOut: "/",
    error: "/sign-in",
  },
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        try {
          const db = await getAdapter();
          const existing = db.get(`SELECT id FROM users WHERE email = ?`, [user.email]);
          if (!existing) {
            const id = crypto.randomUUID();
            db.run(
              `INSERT INTO users(id, name, email, image, createdAt) VALUES(?, ?, ?, ?, ?)`,
              [id, user.name || "", user.email, user.image || "", new Date().toISOString()]
            );
            user.id = id;
          } else {
            user.id = existing.id;
          }
        } catch (e) {
          console.error("[auth] signIn callback error:", e.message);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        try {
          const db = await getAdapter();
          const memberships = db.all(
            `SELECT tm.teamId, tm.role, t.name as teamName, t.slug
             FROM team_members tm JOIN teams t ON t.id = tm.teamId
             WHERE tm.userId = ?`,
            [user.id]
          );
          if (memberships.length > 0) {
            token.orgId = memberships[0].teamId;
            token.orgRole = memberships[0].role;
            token.orgName = memberships[0].teamName;
            token.orgs = memberships;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.orgId = token.orgId;
        session.user.orgRole = token.orgRole;
        session.user.orgName = token.orgName;
        session.user.orgs = token.orgs;
      }
      return session;
    },
  },
  trustHost: true,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
