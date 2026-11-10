import { getStandings } from "@/lib/club-hub/espn";
import { getLeague } from "@/lib/club-hub/leagues";
import { getFootballNews } from "@/lib/news/feed";
import { arrange, CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/news/edition";
import { LEAGUE_IDENTITY } from "@/lib/club-hub/leagueIdentity";
import type { LeagueId } from "@/lib/club-hub/types";
import RotatingTable, { type TableSlide } from "./RotatingTable";

/**
 * Real data for the landing page's feature panels. Each piece streams in after the page shell
 * (inside <Suspense>) and simply disappears if its source is unavailable: the landing page never
 * shows placeholder figures or invented headlines.
 */

/**
 * Each league's real top five right now, from the same standings service as Club Hub, in Club
 * Hub's league order. A league whose table can't be loaded is simply left out of the rotation.
 */
export async function LiveTable() {
  const order: LeagueId[] = ["pl", "laliga", "seriea", "bundesliga", "ligue1"];
  const results = await Promise.allSettled(order.map((id) => getStandings(getLeague(id)!)));
  const slides: TableSlide[] = results.flatMap((r, i) => {
    if (r.status !== "fulfilled" || !r.value.rows.length) return [];
    const id = LEAGUE_IDENTITY[order[i]];
    return [
      {
        league: id.id,
        name: id.name,
        logo: id.logo,
        rows: r.value.rows.slice(0, 5).map((row) => ({ id: row.team.id, position: row.position, name: row.team.shortName, logo: row.team.logo, points: row.points })),
      },
    ];
  });
  return slides.length ? <RotatingTable slides={slides} /> : null;
}

/** Today's headlines from TimesOfFootball's own selection (the strongest stories first). */
export async function LiveHeadlines() {
  const edition = await getFootballNews().catch(() => null);
  if (!edition?.stories.length) return null;
  const ed = arrange(edition.stories);
  const picks = [ed.lead, ...ed.headlines, ...ed.transfers, ...ed.people, ...ed.latest].filter((s): s is NonNullable<typeof s> => !!s).slice(0, 8);
  if (picks.length < 3) return null;
  const card = (s: (typeof picks)[number], hidden: boolean) => (
    <div key={`${s.id}${hidden ? "-b" : ""}`} className="border-b border-white/[0.07] py-3.5" aria-hidden={hidden || undefined}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: CATEGORY_COLOR[s.category] }}>
        {s.hook ?? CATEGORY_LABEL[s.category]}
        {s.subject && <span className="text-slate-400"> · {s.subject}</span>}
      </p>
      <p className="mt-1 text-[15px] font-semibold leading-snug text-slate-100">{s.title}</p>
      <p className="mt-1 text-[11px] text-slate-500">{s.source}</p>
    </div>
  );
  return (
    <div className="relative h-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_80%,transparent)]">
      <div className="lp-track-y" style={{ ["--dur" as string]: `${picks.length * 6}s` }}>
        <div>{picks.map((s) => card(s, false))}</div>
        <div>{picks.map((s) => card(s, true))}</div>
      </div>
    </div>
  );
}
