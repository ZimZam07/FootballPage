import type { NextRequest } from "next/server";
import { getStandings, requireLeague } from "@/lib/club-hub/espn";
import { respond } from "@/lib/club-hub/respond";

export async function GET(req: NextRequest) {
  return respond(() => getStandings(requireLeague(req.nextUrl.searchParams.get("league"))), 300);
}
