import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdapter } from "@/lib/db/driver";

export async function POST(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const orgId = session?.user?.orgId;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!orgId) {
      return NextResponse.json({ error: "Please select an organization first to migrate data to." }, { status: 400 });
    }
    
    if (session?.user?.orgRole !== "admin") {
      return NextResponse.json({ error: "Only Organization Admins can migrate legacy data." }, { status: 403 });
    }
    
    const db = await getAdapter();
    
    let stats = {
      connectionsUpdated: 0,
      apiKeysUpdated: 0,
      usageHistoryUpdated: 0
    };
    
    db.transaction(() => {
      const resConns = db.run(`UPDATE providerConnections SET orgId = ? WHERE orgId IS NULL`, [orgId]);
      stats.connectionsUpdated = resConns?.changes || 0;
      
      const resKeys = db.run(`UPDATE apiKeys SET orgId = ?, userId = ? WHERE orgId IS NULL`, [orgId, userId]);
      stats.apiKeysUpdated = resKeys?.changes || 0;
      
      const resUsage = db.run(`UPDATE usageHistory SET orgId = ?, userId = ? WHERE orgId IS NULL`, [orgId, userId]);
      stats.usageHistoryUpdated = resUsage?.changes || 0;
    });
    
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: "Failed to migrate data" }, { status: 500 });
  }
}
