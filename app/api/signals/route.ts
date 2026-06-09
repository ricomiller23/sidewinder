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

    return NextResponse.json({ signals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
