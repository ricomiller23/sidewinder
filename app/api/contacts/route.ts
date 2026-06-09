import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;

  try {
    const where: any = { isActive: true };
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { issuer: { name: { contains: search, mode: "insensitive" } } },
        { issuer: { ticker: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [contacts, total] = await Promise.all([
      db.contact.findMany({
        where,
        include: {
          issuer: { select: { name: true, ticker: true, cik: true, marketTier: true } },
        },
        orderBy: { outreachScore: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.contact.count({ where }),
    ]);

    return NextResponse.json({
      data: contacts,
      contacts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, status } = body;
    if (!ids || !Array.isArray(ids) || !status) {
      return NextResponse.json({ error: "ids and status required" }, { status: 400 });
    }
    await db.contact.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    return NextResponse.json({ success: true, updated: ids.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
