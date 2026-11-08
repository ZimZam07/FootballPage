import { NextResponse } from "next/server";
import { UpstreamError } from "./espn";

/** Runs a loader and converts its result or failure into a JSON response. */
export async function respond<T>(load: () => Promise<T>, cacheSeconds: number) {
  try {
    const data = await load();
    return NextResponse.json(data, {
      headers: { "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 4}` },
    });
  } catch (err) {
    // Only our own UpstreamError messages are user-facing; anything else is logged, not exposed.
    if (!(err instanceof UpstreamError)) console.error(err);
    const status = err instanceof UpstreamError ? err.status : 500;
    const message = err instanceof UpstreamError ? err.message : "Something went wrong loading this data.";
    return NextResponse.json({ error: message }, { status });
  }
}
