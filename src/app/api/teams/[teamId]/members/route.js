import { NextResponse } from "next/server";
import { authOptions } from "@/auth"
import { getServerSession } from "next-auth";
import { getTeamMembers, addTeamMember, removeTeamMember } from "@/lib/db/auth/teamsRepo";

export async function GET(request, { params }) {
  const { teamId } = await params;
  const members = await getTeamMembers(teamId);
  return NextResponse.json(members);
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { teamId } = await params;
  const { userId, role } = await request.json();

  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const member = await addTeamMember(teamId, userId, role || "member");
  if (!member) return NextResponse.json({ error: "Already a member" }, { status: 409 });
  return NextResponse.json(member);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { teamId } = await params;
  const { userId } = await request.json();

  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  await removeTeamMember(teamId, userId);
  return NextResponse.json({ success: true });
}
