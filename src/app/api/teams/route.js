import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createTeam } from "@/lib/db/auth/teamsRepo";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const team = await createTeam(name, session.user.id);
  return NextResponse.json(team);
}
