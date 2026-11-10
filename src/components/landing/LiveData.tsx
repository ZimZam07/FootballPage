import { getStandings } from "@/lib/club-hub/espn";
import { getLeague } from "@/lib/club-hub/leagues";
import { getFootballNews } from "@/lib/news/feed";
import { arrange, CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/news/edition";

/**
 * Real data for the landing page's feature panels. Each piece streams in after the page shell
 * (inside <Suspense>) and simply disappears if its source is unavailable: the landing page never
 * shows placeholder figures or invented headlines.
 */

/** The Premier League's top five right now, from the same standings service as Club Hub. */
export async function LiveTable() {
  const pl = getLeague("pl");
  const table = pl ? await getStandings(pl).catch(() => null) : null;
  if (!table?.rows.length) return null;
  return (
    <div className="w-[15.5rem] rounded-md border border-white/10 bg-[#0b0c0f]/80 p-3 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md">
      <p className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        <span>Premier League · now</span>
        <span className="text-slate-500">Pts</span>
      </p>
      <ol className="space-y-1.5">
        {table.rows.slice(0, 5).map((r) => (
          <li key={r.team.id} className="flex items-center gap-2.5 text-sm">
            <span className="w-4 text-right font-display font-bold text-slate-500">{r.position}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.team.logo ?? ""} alt="" width={20} height={20} className="h-5 w-5 object-contain" loading="lazy" />
            <span className="min-w-0 flex-1 truncate font-medium text-slate-200">{r.team.shortName}</span>
            <span className="font-display text-base font-bold text-white">{r.points}</span>
          </li>
        ))}
      </ol>
    </div>
  );
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
