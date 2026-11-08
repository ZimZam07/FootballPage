import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HistoricMatchView from "@/components/big-clash/HistoricMatchView";
import { ARCHIVE, getMatch, team } from "@/lib/big-clash/archive";

type Props = { params: Promise<{ slug: string }> };

// The archive is static, so every match page is pre-rendered at build time.
export const dynamicParams = false;
export function generateStaticParams() {
  return ARCHIVE.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = getMatch((await params).slug);
  if (!m) return { title: "Match not found" };
  const title = `${team(m.home).name} ${m.score[0]}–${m.score[1]} ${team(m.away).name} (${m.date.slice(0, 4)})`;
  const url = `/big-clash/${m.slug}`;
  return {
    title: `${title} · ${m.title} · Big Clash`,
    description: m.summary,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: `${m.title}: ${title}`, description: m.summary },
    twitter: { title: `${m.title}: ${title}`, description: m.summary },
  };
}

export default async function Page({ params }: Props) {
  const m = getMatch((await params).slug);
  if (!m) notFound();
  return <HistoricMatchView m={m} />;
}
