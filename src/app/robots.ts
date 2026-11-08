import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Public pages are indexable; the JSON data endpoints are not pages and stay out of search. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
