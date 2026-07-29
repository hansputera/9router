import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserTeams } from "@/lib/db/auth/teamsRepo";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ user: null });

  const teams = await getUserTeams(session.user.id);
  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      orgId: session.user.orgId,
      orgRole: session.user.orgRole,
      orgName: session.user.orgName,
    },
    teams,
  });
}

export async function PATCH(request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Switch active org
  if (body.activeOrgId) {
    const { getUserTeams } = await import("@/lib/db/auth/teamsRepo");
    const teams = await getUserTeams(session.user.id);
    const team = teams.find((t) => t.id === body.activeOrgId);
    if (!team) return NextResponse.json({ error: "Not a member of that team" }, { status: 403 });
    // JWT will be refreshed on next request — store in a cookie or session update
    return NextResponse.json({ success: true, activeOrgId: body.activeOrgId });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
