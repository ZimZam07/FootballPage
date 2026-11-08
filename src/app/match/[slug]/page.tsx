import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MatchPage from "@/components/match/MatchPage";
import { idFromSlug } from "@/lib/match/slug";

type Props = { params: Promise<{ slug: string }> };

/** "401882808-valencia-vs-real-madrid" -> "Valencia vs Real Madrid" */
function titleFromSlug(slug: string) {
  const rest = slug.replace(/^\d+-?/, "");
  const [home, away] = rest.split("-vs-");
  const words = (s = "") => s.split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  return home && away ? `${words(home)} vs ${words(away)}` : "Match";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = titleFromSlug(slug);
  const description = `Score, match centre, line-ups and statistics for ${title}.`;
  return {
    title,
    description,
    alternates: { canonical: `/match/${slug}` },
    openGraph: { url: `/match/${slug}`, title: `${title} | Football Hub`, description },
    twitter: { title: `${title} | Football Hub`, description },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const id = idFromSlug(slug);
  if (!id) notFound();
  return <MatchPage id={id} />;
}
