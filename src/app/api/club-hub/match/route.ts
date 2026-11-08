import type { NextRequest } from "next/server";
import { getMatchDetail, requireId } from "@/lib/club-hub/espn";
import { respond } from "@/lib/club-hub/respond";

/** Statistics, lineups and (for upcoming matches) odds-implied win probability. */
export async function GET(req: NextRequest) {
  return respond(() => getMatchDetail(requireId(req.nextUrl.searchParams.get("event"))), 15);
}
