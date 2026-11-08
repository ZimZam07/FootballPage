"use client";

import { ArrowUpRight, Newspaper } from "lucide-react";
import { relativeTime, useApi } from "@/lib/club-hub/client";
import type { ClubRef, NewsItem } from "@/lib/club-hub/types";
import { ErrorState, SafeImg, Skeleton, StateMessage } from "./ui";

export default function NewsView({ club }: { club: ClubRef }) {
  const url = `/api/club-hub/news?league=${club.league}&team=${club.id}&name=${encodeURIComponent(club.name)}`;
  const { data, error, loading, retry } = useApi<NewsItem[]>(url);

  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (loading || !data) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-5 border-b border-line py-5">
            <div className="flex-1 space-y-3"><Skeleton className="h-3 w-32" /><Skeleton className="h-5 w-11/12" /><Skeleton className="h-4 w-3/4" /></div>
            <Skeleton className="hidden h-24 w-36 sm:block" />
          </div>
        ))}
      </div>
    );
  }
  if (!data.length) {
    return <StateMessage icon={<Newspaper className="h-5 w-5" />} title="No recent news" message={`No ${club.name} stories from the last few weeks were found.`} />;
  }

  const [lead, ...rest] = data;
  return (
    <div>
      {/* Lead story */}
      <a href={lead.url} target="_blank" rel="noopener noreferrer" className={`ch-news ch-fade-up group grid overflow-hidden border-b border-line pb-8 ${lead.image ? "md:grid-cols-5 md:gap-8" : ""}`}>
        {lead.image && (
          <div className="relative aspect-video overflow-hidden rounded-md md:col-span-3 md:aspect-auto md:min-h-80">
            <SafeImg src={lead.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" fallback={<div className="absolute inset-0 bg-slate-200 dark:bg-slate-800" />} />
          </div>
        )}
        <div className={`flex flex-col justify-center pt-5 md:pt-0 ${lead.image ? "md:col-span-2" : ""}`}>
          <Meta item={lead} />
          <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.01em] text-white decoration-1 underline-offset-4 group-hover:underline sm:text-[1.9rem]">{lead.title}</h3>
          {lead.description && <p className="mt-3 line-clamp-3 text-slate-400">{lead.description}</p>}
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-white">Read full story <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
        </div>
      </a>

      <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-2">
        {rest.map((n, i) => (
          <a
            key={n.id}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ch-news ch-fade-up group flex gap-4 border-b border-line py-5"
            style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
          >
            <div className="min-w-0 flex-1">
              <Meta item={n} />
              <h4 className="mt-2 line-clamp-3 text-[17px] font-semibold leading-snug text-slate-100 decoration-1 underline-offset-4 group-hover:underline">{n.title}</h4>
              {n.description && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{n.description}</p>}
            </div>
            {n.image && (
              <div className="relative hidden h-24 w-36 shrink-0 overflow-hidden rounded sm:block">
                <SafeImg src={n.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" fallback={<div className="h-full w-full bg-slate-200 dark:bg-slate-800" />} />
              </div>
            )}
          </a>
        ))}
      </div>
      <p className="pt-4 text-xs text-slate-500">Sources: ESPN and Google News. Links open the original publisher.</p>
    </div>
  );
}

function Meta({ item }: { item: NewsItem }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
      <span className="truncate text-slate-300">{item.source}</span>
      <span className="opacity-40">•</span>
      <time dateTime={item.published} className="shrink-0">{relativeTime(item.published)}</time>
    </div>
  );
}
