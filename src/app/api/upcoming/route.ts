import { NextRequest, NextResponse } from "next/server";
import { getUpcomingReleases } from "@/lib/upcoming";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const result = await getUpcomingReleases(q);
  return NextResponse.json(result);
}
