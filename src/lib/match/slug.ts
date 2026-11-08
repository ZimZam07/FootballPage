// Clean, readable match URLs: /match/401882808-valencia-vs-real-madrid

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const matchSlug = (id: string, home: string, away: string) => `${id}-${slugify(home)}-vs-${slugify(away)}`;

export const matchHref = (id: string, home: string, away: string) => `/match/${matchSlug(id, home, away)}`;

/** Extracts the ESPN event id from a match slug (the leading digits). */
export const idFromSlug = (slug: string): string | null => slug.match(/^(\d{1,12})(?:-|$)/)?.[1] ?? null;
