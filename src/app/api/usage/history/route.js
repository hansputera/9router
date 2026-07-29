import { NextResponse } from "next/server";
import { authOptions } from "@/auth"
import { getServerSession } from "next-auth";
import { getUsageStats } from "@/lib/usageDb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.orgId || null;
    const stats = await getUsageStats("all", orgId || null);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return NextResponse.json({ error: "Failed to fetch usage stats" }, { status: 500 });
  }
}
