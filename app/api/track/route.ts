import { tinybird } from "@/lib/tinybird";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data } = body;

    await tinybird.ingest.pageViews({
      timestamp: new Date(data.timestamp),
      session_id: data.session_id,
      pathname: data.pathname,
      referrer: data.referrer ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
