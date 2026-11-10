"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { sectionHref } from "@/lib/site";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/** Navbar + footer frame for standalone pages (not-found, errors) so no page is a dead end. */
export default function PageShell({ activeTab = "", children }: { activeTab?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col bg-ink text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={(t) => router.push(sectionHref(t))} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-16 sm:px-6 lg:px-8">{children}</main>
      <Footer />
    </div>
  );
}
