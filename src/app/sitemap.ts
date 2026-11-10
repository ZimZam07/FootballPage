import type { MetadataRoute } from "next";
import { ARCHIVE } from "@/lib/big-clash/archive";
import { NEWS_PATH, SECTION_TABS, SITE_URL } from "@/lib/site";

/**
 * The homepage, each section, and every Big Clash archive page. Live ESPN match pages are
 * short-lived and generated on demand, so they are discoverable through links instead of listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const sections = SECTION_TABS.filter((t) => t !== "live").map((t) => ({
    url: `${SITE_URL}/?tab=${t}`,
    lastModified: now,
    changeFrequency: (t === "big" || t === "creators" ? "weekly" : "daily") as "weekly" | "daily",
    priority: 0.8,
  }));
  const archive = ARCHIVE.map((m) => ({
    url: `${SITE_URL}/big-clash/${m.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const news = { url: `${SITE_URL}${NEWS_PATH}`, lastModified: now, changeFrequency: "hourly" as const, priority: 0.9 };
  return [{ url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 }, news, ...sections, ...archive];
}
