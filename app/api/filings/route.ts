import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const form = searchParams.get("form");
  const filter = searchParams.get("filter");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;
  const skip = (page - 1) * limit;

  try {
    const where: any = {};

    if (filter === "3a10") {
      where.has3a10 = true;
    } else if (form) {
      const formMap: Record<string, any> = {
        "F3": { formType: { in: ["F3", "F3A"] } },
        "F4": { formType: { in: ["F4", "F4A"] } },
        "S1": { formType: { in: ["S1", "S1A"] } },
        "SC13D": { formType: { in: ["SC13D", "SC13G"] } },
        "F144": { formType: "F144" },
        "F8K": { formType: "F8K" },
      };
      Object.assign(where, formMap[form] || {});
    }

    const [filings, total] = await Promise.all([
      db.filing.findMany({
        where,
        include: { issuer: { select: { name: true, ticker: true, cik: true, marketTier: true } } },
        orderBy: { filedAt: "desc" },
        skip,
        take: limit,
      }),
      db.filing.count({ where }),
    ]);

    return NextResponse.json({ filings, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
