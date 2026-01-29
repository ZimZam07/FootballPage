"use client";

import { useState } from "react";
import {
  liveSites,
  leagues,
  highlightLinks,
  creators,
  bigMatches,
  derbies,
  iconicRivalries,
  matchDetails,
  TimelineItem,
  StatItem,
  LineupCategory
} from "@/data/footballData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ExternalLink, Play, Tv, Youtube, User, Trophy, Shield, Star, ChevronDown } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("live");
  const [highlightLeague, setHighlightLeague] = useState("");
  const [highlightTeam, setHighlightTeam] = useState("");
  const [bigMatchTeam, setBigMatchTeam] = useState("");
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [matchDetailTab, setMatchDetailTab] = useState("timeline");
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("favoriteTeams");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const toggleFavorite = (teamKey: string) => {
    const newFavorites = favorites.includes(teamKey)
      ? favorites.filter(fav => fav !== teamKey)
      : [...favorites, teamKey];
    setFavorites(newFavorites);
    localStorage.setItem("favoriteTeams", JSON.stringify(newFavorites));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Render Sections based on activeTab */}
        <div className="space-y-12">

          {activeTab === "live" && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-lg bg-teal-500/10 p-2">
                  <Tv className="h-6 w-6 text-teal-500" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Free Sites To Watch Live</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {liveSites.map((site) => (
                  <div key={site.name} className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:shadow-teal-500/5">
                    <h3 className="text-xl font-bold">{site.name}</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">{site.description}</p>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-2 font-semibold text-teal-600 dark:text-teal-400 transition-colors group-hover:text-teal-500"
                    >
                      Visit Site <ExternalLink className="h-4 w-4" />
                    </a>
                    <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-teal-500/10 blur-2xl transition-all group-hover:bg-teal-500/20" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "highlights" && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <Play className="h-6 w-6 text-red-500" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Watch Football Highlights</h2>
              </div>

              <div className="mb-12 space-y-8">
                {favorites.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Your Favorite Teams</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {favorites.map((favKey) => {
                        const team = highlightLinks[favKey];
                        if (!team) return null;
                        return (
                          <div
                            key={favKey}
                            className={`group relative flex items-center gap-4 rounded-2xl border ${highlightTeam === favKey ? 'border-teal-500 bg-teal-500/5' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900'} p-4 shadow-sm transition-all hover:shadow-md cursor-pointer`}
                            onClick={() => setHighlightTeam(favKey)}
                          >
                            <img src={team.logo} alt={team.name} className="h-10 w-10 object-contain" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold truncate">{team.name}</h4>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(favKey);
                              }}
                              className="rounded-full p-2 text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                            >
                              <Star className="h-4 w-4 fill-current" />
                            </button>
                            {highlightTeam === favKey && (
                              <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-white animate-in zoom-in">
                                <ExternalLink className="h-2.5 w-2.5" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="w-full max-w-xs">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">1. Select League</label>
                    <select
                      value={highlightLeague}
                      onChange={(e) => {
                        setHighlightLeague(e.target.value);
                        setHighlightTeam("");
                        setIsTeamDropdownOpen(false);
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all shadow-sm"
                    >
                      <option value="">Choose League...</option>
                      {leagues.map((league) => (
                        <option key={league.id} value={league.id}>{league.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full max-w-xs relative">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">2. Select Team</label>
                    <button
                      onClick={() => highlightLeague && setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                      disabled={!highlightLeague}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="truncate">
                        {highlightTeam ? highlightLinks[highlightTeam]?.name : (highlightLeague ? "Choose Team..." : "Select League First")}
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isTeamDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isTeamDropdownOpen && highlightLeague && (
                      <div className="absolute z-50 mt-2 w-full max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        {Object.entries(leagues.find(l => l.id === highlightLeague)!.teams).map(([key, data]) => (
                          <div
                            key={key}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${highlightTeam === key ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'}`}
                            onClick={() => {
                              setHighlightTeam(key);
                              setIsTeamDropdownOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-3 truncate">
                              <img src={data.logo} alt={data.name} className="h-5 w-5 object-contain" />
                              <span className="font-medium truncate">{data.name}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(key);
                              }}
                              className={`rounded-full p-1.5 transition-all hover:scale-110 ${favorites.includes(key) ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600 hover:text-yellow-400'}`}
                            >
                              <Star className={`h-4 w-4 ${favorites.includes(key) ? 'fill-current' : 'hover:fill-current'}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {highlightTeam && highlightLinks[highlightTeam] && (
                <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-8 text-center shadow-2xl transition-all animate-in zoom-in-95 duration-300">
                  <img src={highlightLinks[highlightTeam].logo} alt={highlightLinks[highlightTeam].name} className="mx-auto h-24 w-24 object-contain" />
                  <h3 className="mt-6 text-2xl font-bold">{highlightLinks[highlightTeam].name} Highlights</h3>
                  <p className="mt-2 text-slate-500 dark:text-slate-400">Latest official match highlights from YouTube</p>
                  <a
                    href={highlightLinks[highlightTeam].link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white transition-all hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20"
                  >
                    Watch on YouTube <Youtube className="h-5 w-5" />
                  </a>
                </div>
              )}

              {/* Match Details Section */}
              {highlightTeam && matchDetails[highlightTeam] && (
                <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
                  {/* Match Summary Card */}
                  <div className="border-b border-slate-200 dark:border-white/5 p-6 md:p-8">
                    <div className="mb-6 flex items-center justify-between">
                      <span className="text-sm font-bold tracking-wider text-slate-500 uppercase">{matchDetails[highlightTeam].league} • {matchDetails[highlightTeam].matchDate}</span>
                      <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase">{matchDetails[highlightTeam].status}</span>
                    </div>

                    <div className="flex items-center justify-around gap-4 md:gap-12">
                      <div className="flex flex-1 flex-col items-center gap-4 text-center">
                        <img src={matchDetails[highlightTeam].homeTeam.logo} alt="" className="h-20 w-20 object-contain drop-shadow-lg" />
                        <div>
                          <h4 className="text-xl font-black uppercase tracking-tight">{matchDetails[highlightTeam].homeTeam.name}</h4>
                          <span className="text-xs font-medium text-slate-500">{matchDetails[highlightTeam].homeTeam.formation}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <div className="text-6xl font-black italic tracking-tighter text-slate-900 dark:text-white md:text-7xl">
                          {matchDetails[highlightTeam].homeTeam.score} - {matchDetails[highlightTeam].awayTeam.score}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col items-center gap-4 text-center">
                        <img src={matchDetails[highlightTeam].awayTeam.logo} alt="" className="h-20 w-20 object-contain drop-shadow-lg" />
                        <div>
                          <h4 className="text-xl font-black uppercase tracking-tight">{matchDetails[highlightTeam].awayTeam.name}</h4>
                          <span className="text-xs font-medium text-slate-500">{matchDetails[highlightTeam].awayTeam.formation}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-8 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <div className="text-right">
                        {matchDetails[highlightTeam].timeline.filter((e: TimelineItem) => e.team === 'home' && e.type === 'goal').map((e: TimelineItem, i: number) => (
                          <div key={i}>{e.player} {e.minute}</div>
                        ))}
                      </div>
                      <div className="text-left">
                        {matchDetails[highlightTeam].timeline.filter((e: TimelineItem) => e.team === 'away' && e.type === 'goal').map((e: TimelineItem, i: number) => (
                          <div key={i}>{e.player} {e.minute}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tabs Navigation */}
                  <div className="flex border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                    {['timeline', 'stats', 'lineups'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setMatchDetailTab(tab)}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${matchDetailTab === tab ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                      >
                        {tab === 'stats' ? 'Match Stats' : tab}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-6 md:p-8">
                    {matchDetailTab === 'timeline' && (
                      <div className="mx-auto max-w-lg space-y-6">
                        {matchDetails[highlightTeam].timeline.map((event: TimelineItem, i: number) => (
                          <div key={i} className="flex items-center gap-6">
                            <div className="w-12 text-right text-xs font-black text-slate-400">{event.minute}</div>
                            <div className="relative flex flex-1 items-center gap-4">
                              <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
                              <div className={`flex items-center gap-3 ${event.team === 'neutral' ? 'mx-auto' : event.team === 'home' ? 'flex-row' : 'flex-row-reverse ml-auto'}`}>
                                {event.type === 'goal' && <span className="text-lg">⚽</span>}
                                {event.type === 'yellow' && <div className="h-4 w-3 rounded-sm bg-yellow-400" />}
                                {event.type === 'red' && <div className="h-4 w-3 rounded-sm bg-red-500" />}
                                {event.type === 'info' && <Play className="h-4 w-4 rotate-90 text-slate-400" />}
                                <span className="text-sm font-bold">{event.player || (event.minute.includes('match') ? 'End of Match' : event.minute)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {matchDetailTab === 'stats' && (
                      <div className="mx-auto max-w-2xl space-y-8">
                        {matchDetails[highlightTeam].stats.map((stat: StatItem, i: number) => (
                          <div key={i} className="space-y-3">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                              <span className={Number(stat.homePercentage) > Number(stat.awayPercentage) ? 'text-teal-500' : ''}>{stat.home}</span>
                              <span className="text-slate-400">{stat.label}</span>
                              <span className={Number(stat.awayPercentage) > Number(stat.homePercentage) ? 'text-teal-500' : ''}>{stat.away}</span>
                            </div>
                            <div className="flex h-1.5 gap-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                              <div
                                className="h-full bg-slate-300 dark:bg-white/10 transition-all duration-1000"
                                style={{ width: `${stat.homePercentage}%` }}
                              />
                              <div
                                className="h-full bg-teal-500 transition-all duration-1000"
                                style={{ width: `${stat.awayPercentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {matchDetailTab === 'lineups' && (
                      <div className="grid gap-12 md:grid-cols-2">
                        {['home', 'away'].map((side) => (
                          <div key={side} className="space-y-6">
                            <div className="flex items-center gap-3">
                              <img src={matchDetails[highlightTeam][side === 'home' ? 'homeTeam' : 'awayTeam'].logo} alt="" className="h-8 w-8 object-contain" />
                              <h5 className="font-black uppercase tracking-tight">{matchDetails[highlightTeam][side === 'home' ? 'homeTeam' : 'awayTeam'].name}</h5>
                              <span className="text-[10px] font-bold text-slate-400">{matchDetails[highlightTeam][side === 'home' ? 'homeTeam' : 'awayTeam'].formation}</span>
                            </div>
                            <div className="space-y-4 rounded-2xl bg-slate-50/50 dark:bg-white/5 p-4">
                              {matchDetails[highlightTeam].lineups[side as 'home' | 'away'].map((cat: LineupCategory, i: number) => (
                                <div key={i}>
                                  <h6 className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{cat.category}</h6>
                                  <div className="space-y-2">
                                    {cat.players.map((p: any, pi: number) => (
                                      <div key={pi} className="flex items-center justify-between text-sm">
                                        <span className="font-bold">{p.name}</span>
                                        <span className="text-xs font-medium text-slate-500">{p.number}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === "creators" && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-lg bg-orange-500/10 p-2">
                  <User className="h-6 w-6 text-orange-500" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Indian Football Creators</h2>
              </div>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {creators.map((creator) => (
                  <div key={creator.name} className="flex flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:border-orange-500/30 hover:shadow-orange-500/5">
                    <span className="mb-4 inline-flex w-fit rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-500 tracking-wide uppercase">
                      {creator.badge}
                    </span>
                    <h3 className="text-2xl font-bold">{creator.name}</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 line-clamp-2">{creator.description}</p>
                    <a
                      href={creator.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 py-2.5 font-semibold transition-all hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      Visit Channel <Youtube className="h-4 w-4 text-red-500" />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "big" && (
            <section className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Iconic Rivalries */}
              <div>
                <div className="mb-10 text-center">
                  <h2 className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">🔥 Iconic Rivalries</h2>
                  <div className="mt-2 h-1 w-20 bg-teal-500 mx-auto rounded-full" />
                </div>

                <div className="space-y-12">
                  {derbies.map((derby, i) => (
                    <div key={i} className="space-y-8">
                      <div className="flex items-center gap-4">
                        <Shield className="h-8 w-8 text-teal-500" />
                        <h3 className="text-2xl font-black uppercase tracking-tight">{derby.title}</h3>
                      </div>

                      {derby.matches ? (
                        <div className="grid gap-6">
                          {derby.matches.map((match, mi) => (
                            <div key={mi} className="relative flex flex-col items-center justify-between gap-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 p-6 shadow-lg md:flex-row hover:border-teal-500/20 transition-all group overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-teal-500/20 group-hover:bg-teal-500 transition-colors" />

                              <div className="flex flex-col items-center gap-2">
                                <span className="rounded-full bg-slate-100 dark:bg-white/5 px-3 py-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">{match.season}</span>
                                <span className="text-[10px] font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wide">{match.league}</span>
                              </div>

                              <div className="flex flex-1 items-center justify-around gap-4 w-full md:w-auto">
                                <div className="flex flex-col items-center gap-3">
                                  <img src={match.team1.logo} alt={match.team1.name} className="h-12 w-12 object-contain" />
                                  <span className="text-xs font-bold uppercase tracking-tight">{match.team1.name}</span>
                                </div>

                                <div className={`text-3xl font-black italic tracking-tighter ${match.highlight ? 'text-red-600 scale-110 drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]' : 'text-slate-400'}`}>
                                  {match.score}
                                </div>

                                <div className="flex flex-col items-center gap-3">
                                  <img src={match.team2.logo} alt={match.team2.name} className="h-12 w-12 object-contain" />
                                  <span className="text-xs font-bold uppercase tracking-tight">{match.team2.name}</span>
                                </div>
                              </div>

                              <a
                                href={match.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-white px-6 py-3 text-sm font-black text-white dark:text-slate-900 transition-all hover:scale-105"
                              >
                                HIGHLIGHTS <Play className="h-4 w-4 fill-current" />
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                          <div>
                            <h4 className="text-xl font-bold">{derby.name}</h4>
                            <p className="text-slate-500 dark:text-slate-400">{derby.description}</p>
                          </div>
                          <a
                            href={derby.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 font-bold text-white transition-all hover:bg-teal-600"
                          >
                            Watch Highlights <Youtube className="h-5 w-5" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
