"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { sectionHref } from "@/lib/site";

/** The site navigation on the landing page: no section is active; every tab opens its section. */
export default function LandingNav() {
  const router = useRouter();
  return <Navbar activeTab="" setActiveTab={(t) => router.push(sectionHref(t))} />;
}
