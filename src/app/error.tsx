"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";
import PageShell from "@/components/PageShell";

/** Route-level error boundary: a branded page with a retry instead of a blank screen. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <p className="kicker flex items-center gap-3">
        <span className="font-display text-sm font-bold tracking-[0.08em] text-[#ff4b3a]">Error</span>
        <span className="h-px w-6 bg-[#ff4b3a] opacity-60" aria-hidden />
        Stoppage time
      </p>
      <h1 className="mt-3 font-display text-5xl font-extrabold uppercase leading-[0.9] text-white sm:text-7xl">Something went wrong</h1>
      <p className="mt-4 max-w-xl text-slate-400">This page hit an unexpected problem. Try again — if it keeps happening, the football data provider may be having issues.</p>
      <button onClick={reset} className="mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
        <RotateCw className="h-4 w-4" /> Try again
      </button>
    </PageShell>
  );
}
