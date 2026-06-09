import { NextResponse } from "next/server";
import { runDailyPoll } from "@/lib/edgar/ingestion";

export const maxDuration = 300;

export async function GET() {
  try {
    const result = await runDailyPoll();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
