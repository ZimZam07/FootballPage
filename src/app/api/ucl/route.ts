import { respond } from "@/lib/club-hub/respond";
import { getUclOverview } from "@/lib/ucl/service";

/** Champions League season, standings, fixtures, knockout ties, clubs and top scorers. */
export async function GET() {
  return respond(getUclOverview, 30);
}
