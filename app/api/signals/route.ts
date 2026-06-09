import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const signals = await db.filing.findMany({
      where: {
        OR: [
          { hasAgedDebt: true },
          { hasRestricted: true },
          { has3a10: true },
        ],
      },
      include: {
        issuer: { select: { name: true, ticker: true, cik: true, marketTier: true } },
      },
      orderBy: { filedAt: "desc" },
      take: 100,
    });

    const agedDebt = signals.filter(s => s.hasAgedDebt);
    const restricted = signals.filter(s => s.hasRestricted);
    const s3a10 = signals.filter(s => s.has3a10);

    return NextResponse.json({
      signals,
      data: {
        signals,
        agedDebt,
        restricted,
        s3a10
      },
      // Flat properties in case the UI reads directly
      agedDebt,
      restricted,
      s3a10
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
