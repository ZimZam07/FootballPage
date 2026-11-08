import type { CSSProperties, ReactNode } from "react";

/**
 * The opening of every Football Hub section: a numbered kicker, a condensed headline,
 * a short standfirst and an optional aside, closed by a hairline. Sections differ by
 * accent and by what sits in the aside — not by a different template.
 */
export default function Masthead({
  index,
  kicker,
  title,
  intro,
  accent = "#d4f53c",
  aside,
  className = "",
}: {
  index: string;
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  accent?: string;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`ch-fade-up grid gap-6 border-b border-line pb-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12 ${className}`} style={{ "--mh": accent } as CSSProperties}>
      <div className="min-w-0">
        <p className="kicker flex items-center gap-3">
          <span className="font-display text-sm font-bold tracking-[0.08em] text-[var(--mh)]">{index}</span>
          <span className="h-px w-6 bg-[var(--mh)] opacity-60" aria-hidden />
          {kicker}
        </p>
        <h1 className="mt-3 font-display text-[2.6rem] font-extrabold uppercase leading-[0.92] tracking-[-0.005em] text-white sm:text-6xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-400 sm:text-base">{intro}</p>}
      </div>
      {aside && <div className="min-w-0">{aside}</div>}
    </header>
  );
}
