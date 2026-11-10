"use client";

import dynamic from "next/dynamic";

/** The 3D trophy is its own chunk, loaded after first paint into a box sized up front. */
const TrophyGL = dynamic(() => import("./TrophyGL"), { ssr: false, loading: () => null });

export default function TrophySlot({ className = "" }: { className?: string }) {
  return <TrophyGL className={className} />;
}
