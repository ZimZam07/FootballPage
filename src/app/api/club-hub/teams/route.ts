import { getAllTeams } from "@/lib/club-hub/espn";
import { respond } from "@/lib/club-hub/respond";

/** Every club in every Club Hub league, ordered by popularity within each league. */
export async function GET() {
  return respond(getAllTeams, 60 * 60);
}
