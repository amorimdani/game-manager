import { NextResponse } from "next/server";
import { getUpcomingReleases } from "@/lib/upcoming";

export async function GET() {
  const result = await getUpcomingReleases();
  return NextResponse.json(result);
}
