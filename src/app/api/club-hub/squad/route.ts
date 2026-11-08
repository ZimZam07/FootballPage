import type { NextRequest } from "next/server";
import { getSquad, requireId, requireLeague } from "@/lib/club-hub/espn";
import { respond } from "@/lib/club-hub/respond";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  return respond(() => getSquad(requireLeague(q.get("league")), requireId(q.get("team"))), 60 * 60);
}
