import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = { title: "Page not found" };

const SECTIONS = [
  { href: "/?tab=club", label: "Club Hub", hint: "Your club's dashboard" },
  { href: "/?tab=ucl", label: "Champions League", hint: "Standings, fixtures and knockouts" },
  { href: "/?tab=big", label: "Big Clash", hint: "The matches that made history" },
  { href: "/?tab=creators", label: "Creators", hint: "Football channels worth following" },
];

export default function NotFound() {
  return (
    <PageShell>
      <p className="kicker flex items-center gap-3">
        <span className="font-display text-sm font-bold tracking-[0.08em] text-volt">404</span>
        <span className="h-px w-6 bg-volt opacity-60" aria-hidden />
        Off the pitch
      </p>
      <h1 className="mt-3 font-display text-5xl font-extrabold uppercase leading-[0.9] text-white sm:text-7xl">This page isn&apos;t in the squad</h1>
      <p className="mt-4 max-w-xl text-slate-400">The link may be old or mistyped. Pick up from one of these instead:</p>
      <ul className="mt-10 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map((s) => (
          <li key={s.href} className="border-b border-line sm:odd:border-r lg:border-r lg:last:border-r-0">
            <Link href={s.href} className="block px-1 py-5 transition hover:bg-white/[0.02] sm:px-5">
              <span className="block font-display text-2xl font-bold uppercase text-white">{s.label}</span>
              <span className="text-sm text-slate-500">{s.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
