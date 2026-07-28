import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUsageStats } from "@/lib/usageDb";

export async function GET() {
  try {
    const { orgId } = await auth();
    const stats = await getUsageStats("all", orgId || null);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return NextResponse.json({ error: "Failed to fetch usage stats" }, { status: 500 });
  }
}
