import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
import { todayUtc } from "@/lib/big-clash/cover";
import { WATCH_LIVE_PATH } from "@/lib/site";

/** Rendered per request like the home page, since the shared section component reads the URL's ?tab=. */
export const dynamic = "force-dynamic";

const TITLE = "Watch Live Matches | Football Hub";
const DESCRIPTION = "Football streaming websites to explore match coverage across the web.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: WATCH_LIVE_PATH },
  openGraph: { url: WATCH_LIVE_PATH, title: TITLE, description: DESCRIPTION },
  twitter: { title: TITLE, description: DESCRIPTION },
};

/**
 * Watch Live Matches, at its own address. It is the same section component the home page uses
 * (with no ?tab=, HomeClient opens Watch Live), so nothing is duplicated.
 */
export default function Page() {
  return <HomeClient coverDay={todayUtc()} />;
}
