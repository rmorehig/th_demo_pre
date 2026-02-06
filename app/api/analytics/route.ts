import { tinybird } from "@/lib/tinybird";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await tinybird.query.topPages({
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19),
      end_date: new Date().toISOString().replace("T", " ").slice(0, 19),
      limit: 10,
    });

    return NextResponse.json({ topPages: result.data });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
