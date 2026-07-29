import { NextResponse } from "next/server";
import { authOptions } from "@/auth"
import { getServerSession } from "next-auth";
import { createTeam } from "@/lib/db/auth/teamsRepo";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const team = await createTeam(name, session.user.id);
  return NextResponse.json(team);
}
