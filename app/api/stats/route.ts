import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [totalFilings, totalContacts, totalIssuers, agedDebtCount, restrictedCount, filing3a10Count, lastPipeline] = await Promise.all([
      db.filing.count(),
      db.contact.count(),
      db.issuer.count(),
      db.filing.count({ where: { hasAgedDebt: true } }),
      db.filing.count({ where: { hasRestricted: true } }),
      db.filing3a10.count(),
      db.pipelineState.findFirst({ where: { feedType: "daily_poll" } }),
    ]);

    return NextResponse.json({
      totalFilings,
      totalContacts,
      totalIssuers,
      agedDebtCount,
      restrictedCount,
      filing3a10Count,
      lastPolledAt: lastPipeline?.lastPolledAt || null,
      
      // UI aliases
      agedDebtFlags: agedDebtCount,
      restrictedFlags: restrictedCount,
      filingsToday: totalFilings, // or actual filings today if tracked
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
