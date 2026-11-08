import type { NextRequest } from "next/server";
import { getClubOverview, requireId, requireLeague } from "@/lib/club-hub/espn";
import { respond } from "@/lib/club-hub/respond";

/** Club identity, upcoming fixtures and completed results across all competitions. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  return respond(() => getClubOverview(requireLeague(q.get("league")), requireId(q.get("team"))), 30);
}
