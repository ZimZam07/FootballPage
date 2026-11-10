import Link from "next/link";
import { sectionHref } from "@/lib/site";

const SECTIONS: [string, string][] = [
  ["live", "Watch Live Matches"],
  ["club", "Club Hub"],
  ["ucl", "UEFA Champions League"],
  ["news", "TimesOfFootball"],
  ["big", "Big Clash"],
  ["creators", "Creators"],
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav aria-label="Football Hub sections" className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {SECTIONS.map(([id, name]) => (
            <Link key={id} href={sectionHref(id)} className="text-slate-400 transition hover:text-white">
              {name}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-lg font-extrabold uppercase tracking-wide text-slate-300">
            <Link href="/" className="transition hover:text-white">
              Football <span className="text-volt">Hub</span>
            </Link>
            <span className="ml-3 font-sans text-sm font-normal normal-case tracking-normal text-slate-500">Your gateway to the world of football.</span>
          </p>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Interactive Football Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
