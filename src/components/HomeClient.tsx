"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { NEWS_PATH } from "@/lib/site";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClubHub from "@/components/club-hub/ClubHub";
import StreamDirectory from "@/components/streams/StreamDirectory";
import CreatorsSection from "@/components/creators/CreatorsSection";
import BigClash from "@/components/big-clash/BigClash";
import type { ArchiveFilters } from "@/lib/big-clash/archive";
import ChampionsLeague from "@/components/ucl/ChampionsLeague";

export type HomeTab = "live" | "club" | "ucl" | "big" | "creators";
export const HOME_TABS: HomeTab[] = ["live", "club", "ucl", "big", "creators"];

export default function HomeClient({ bigFilters, coverDay }: { bigFilters?: Partial<ArchiveFilters>; coverDay: number }) {
  const router = useRouter();
  // The URL is the single source of truth for the open tab. Next keeps useSearchParams in sync with
  // history.replaceState, so refreshes, internal links and back/forward all agree with what is shown.
  const urlTab = useSearchParams().get("tab") as HomeTab | null;
  const activeTab: HomeTab = urlTab && HOME_TABS.includes(urlTab) ? urlTab : "live";
  const setActiveTab = (tab: string) => {
    // The Football Wire is its own page; the other sections swap in place.
    if (tab === "news") return router.push(NEWS_PATH);
    // Pass null (not window.history.state) so Next treats this as a URL change and updates useSearchParams.
    window.history.replaceState(null, "", tab === "live" ? "/" : `/?tab=${tab}`);
  };

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 sm:pt-10 lg:px-8">

        {/* Render Sections based on activeTab */}
        <div className="space-y-12">

          {activeTab === "live" && <StreamDirectory />}

          {activeTab === "club" && <ClubHub />}

          {activeTab === "creators" && <CreatorsSection />}

          {activeTab === "big" && <BigClash initial={bigFilters} coverDay={coverDay} />}

          {activeTab === "ucl" && <ChampionsLeague onGoToClubHub={() => setActiveTab("club")} />}

        </div>
      </main>

      <Footer />
    </div>
  );
}
