import type { NextRequest } from "next/server";
import { requireId, requireLeague, UpstreamError } from "@/lib/club-hub/espn";
import { getClubNews } from "@/lib/club-hub/news";
import { respond } from "@/lib/club-hub/respond";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  return respond(async () => {
    const name = q.get("name")?.trim();
    if (!name || name.length > 60) throw new UpstreamError("Invalid club name.", 400);
    return getClubNews(requireLeague(q.get("league")), requireId(q.get("team")), name);
  }, 60 * 10);
}
