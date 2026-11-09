import { respond } from "@/lib/club-hub/respond";
import { getUclCleanSheets } from "@/lib/ucl/service";

/** Goalkeeper clean sheets in this season's Champions League, counted from completed matches. */
export async function GET() {
  return respond(getUclCleanSheets, 60 * 30);
}
