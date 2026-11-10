import type { Metadata } from "next";
import WirePage from "@/components/news/WirePage";
import { getFootballNews } from "@/lib/news/feed";
import { NEWS_PATH } from "@/lib/site";

/** Re-built at most every ten minutes from the cached feeds; visitors never wait on the newsrooms. */
export const revalidate = 600;

const TITLE = "The Football Wire: latest football news and transfers | Football Hub";
const DESCRIPTION =
  "The latest football news: transfers, shocks, comebacks, managers and the stories everyone is talking about, from BBC Sport, The Guardian, Sky Sports and ESPN.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: NEWS_PATH },
  openGraph: { url: NEWS_PATH, title: TITLE, description: DESCRIPTION },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default async function Page() {
  const edition = await getFootballNews();
  return <WirePage edition={edition} />;
}
