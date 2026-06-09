import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;
  const skip = (page - 1) * limit;

  try {
    const [filings, total] = await Promise.all([
      db.filing.findMany({
        where: { has3a10: true },
        include: { issuer: { select: { name: true, ticker: true, cik: true, marketTier: true } } },
        orderBy: { filedAt: "desc" },
        skip,
        take: limit,
      }),
      db.filing.count({ where: { has3a10: true } }),
    ]);

    return NextResponse.json({
      data: filings,
      filings,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
