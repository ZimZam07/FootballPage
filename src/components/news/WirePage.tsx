"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { sectionHref } from "@/lib/site";
import type { NewsEdition } from "@/lib/news/types";
import FootballWire from "./FootballWire";

/** The Football Wire's own page, framed by the same navigation and footer as every section. */
export default function WirePage({ edition }: { edition: NewsEdition }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <Navbar activeTab="news" setActiveTab={(t) => (t === "news" ? window.scrollTo({ top: 0, behavior: "smooth" }) : router.push(sectionHref(t)))} />
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <FootballWire edition={edition} />
      </main>
      <Footer />
    </div>
  );
}
