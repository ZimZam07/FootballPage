"use client";

import dynamic from "next/dynamic";

/** The 3D ball loads after first paint, in a square box reserved up front so nothing shifts. */
const HeroBall = dynamic(() => import("./HeroBall"), { ssr: false, loading: () => null });

export default function HeroBallSlot() {
  return (
    <div className="aspect-square w-full">
      <HeroBall className="h-full w-full" />
    </div>
  );
}
