"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Clapperboard, MonitorPlay, Shield, Swords } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/** A starball-inspired mark: a ball outline with a ring of stars around a centre star. */
function StarballIcon({ className = "" }: { className?: string }) {
  const star = (cx: number, cy: number, R: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? R * 0.45 : R;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
    }
    return pts.join(" ");
  };
  const ring = Array.from({ length: 5 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return [12 + 6.1 * Math.cos(a), 12 + 6.1 * Math.sin(a)] as const;
  });
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
      <polygon points={star(12, 12, 3)} fill="currentColor" />
      {ring.map(([x, y], i) => <polygon key={i} points={star(x, y, 2)} fill="currentColor" opacity="0.85" />)}
    </svg>
  );
}

/** Football Hub's mark: the centre circle and halfway line of a pitch. */
function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden>
      <rect x="1" y="1" width="26" height="26" rx="5" fill="#d4f53c" />
      <path d="M14 3.5v21" stroke="#0b0c0f" strokeWidth="2" />
      <circle cx="14" cy="14" r="5.25" fill="none" stroke="#0b0c0f" strokeWidth="2" />
      <circle cx="14" cy="14" r="1.6" fill="#0b0c0f" />
    </svg>
  );
}

export const tabs: { id: string; label: string; hint: string; icon: (cls: string) => ReactNode }[] = [
  {
    id: "live",
    label: "Watch Live Matches",
    hint: "Football streaming websites",
    icon: (cls) => (
      <span className="relative inline-flex">
        <MonitorPlay className={cls} strokeWidth={1.75} />
        <span className="nav-live-dot absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#ff4b3a]" />
      </span>
    ),
  },
  { id: "club", label: "Club Hub", hint: "Your club's dashboard", icon: (cls) => <Shield className={cls} strokeWidth={1.75} /> },
  { id: "creators", label: "Creators", hint: "Football creators worth following", icon: (cls) => <Clapperboard className={cls} strokeWidth={1.75} /> },
  { id: "big", label: "Big Clash", hint: "The matches that made history", icon: (cls) => <Swords className={cls} strokeWidth={1.75} /> },
  { id: "ucl", label: "UEFA Champions League", hint: "Standings, fixtures and knockouts", icon: (cls) => <StarballIcon className={cls} /> },
];

/** Positions an absolutely placed bar under a target element inside `track` (direct DOM write, no re-render). */
function place(bar: HTMLElement | null, target: HTMLElement | null, track: HTMLElement | null) {
  if (!bar || !target || !track) return false;
  const t = track.getBoundingClientRect();
  const r = target.getBoundingClientRect();
  if (!r.width) return false;
  bar.style.width = `${r.width}px`;
  bar.style.transform = `translate3d(${r.left - t.left}px,0,0)`;
  return true;
}

function Brand({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="nav-brand group flex shrink-0 items-center gap-2.5 rounded-md py-1 pr-2" aria-label="Football Hub — go to Watch Live Matches">
      <BrandMark className="nav-brand-mark h-7 w-7" />
      <span className="font-display text-[1.35rem] font-extrabold uppercase leading-none tracking-[0.01em] text-white">
        Football <span className="text-volt">Hub</span>
      </span>
    </button>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3 w-5" aria-hidden>
      <span className={`absolute left-0 h-[1.5px] w-5 bg-current transition-all duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
      <span className={`absolute left-0 top-1.5 h-[1.5px] w-3.5 bg-current transition-all duration-300 ${open ? "opacity-0" : ""}`} />
      <span className={`absolute left-0 h-[1.5px] w-5 bg-current transition-all duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
    </span>
  );
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const shell = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const hover = useRef<HTMLSpanElement>(null);
  const items = useRef<Record<string, HTMLButtonElement | null>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const active = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  // Always delegate: on match pages the "active" tab still navigates back to its section.
  const go = (id: string) => {
    setMenuOpen(false);
    setActiveTab(id);
  };
  const goHome = () => {
    go("live");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Keep the active underline glued to the active tab — on change, resize, breakpoint and font load.
  const syncIndicator = useCallback(() => {
    const el = indicator.current;
    if (place(el, items.current[activeTab] ?? null, track.current) && el && !el.dataset.ready) {
      requestAnimationFrame(() => (el.dataset.ready = "1"));
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    syncIndicator();
  }, [syncIndicator]);

  useEffect(() => {
    const t = track.current;
    if (!t || !("ResizeObserver" in window)) return;
    const ro = new ResizeObserver(() => syncIndicator());
    ro.observe(t);
    Object.values(items.current).forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [syncIndicator]);

  // Firm up the bar once the page scrolls (attribute toggle only — no re-render).
  useEffect(() => {
    const onScroll = () => {
      const s = window.scrollY > 4 ? "1" : "";
      if (shell.current && shell.current.dataset.scrolled !== s) shell.current.dataset.scrolled = s;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on Escape or when the viewport grows past the mobile breakpoint.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => mq.matches && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [menuOpen]);

  const showHover = (id: string) => {
    const h = hover.current;
    if (!h) return;
    if (id === activeTab) {
      h.style.opacity = "0";
      return;
    }
    const wasHidden = h.style.opacity !== "1";
    if (wasHidden) h.style.transition = "opacity 150ms ease";
    place(h, items.current[id] ?? null, track.current);
    h.style.opacity = "1";
    if (wasHidden) requestAnimationFrame(() => (h.style.transition = ""));
  };
  const hideHover = () => {
    if (hover.current) hover.current.style.opacity = "0";
  };

  return (
    <header ref={shell} className="nav-shell sticky top-0 z-50 w-full">
      <div className="relative mx-auto flex h-[60px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Brand onClick={goHome} />

        {/* Desktop & tablet: text tabs on the bar's baseline, with a sliding underline */}
        <nav aria-label="Main" className="hidden h-full md:block">
          <div ref={track} className="relative flex h-full items-stretch" onPointerLeave={hideHover}>
            <span ref={hover} className="nav-hover pointer-events-none absolute bottom-0 left-0 h-px opacity-0" aria-hidden />
            <span ref={indicator} className="nav-indicator pointer-events-none absolute bottom-0 left-0 h-[2px]" aria-hidden />
            {tabs.map((t) => {
              const on = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    items.current[t.id] = el;
                  }}
                  onClick={() => go(t.id)}
                  onPointerEnter={() => showHover(t.id)}
                  onFocus={() => showHover(t.id)}
                  onBlur={hideHover}
                  aria-current={on ? "page" : undefined}
                  title={t.label}
                  data-k={t.id}
                  className={`nav-item group relative flex items-center gap-2 whitespace-nowrap px-3 text-[13.5px] font-medium transition-colors duration-200 xl:px-3.5 ${
                    on ? "text-white" : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  <span className={`nav-icon flex transition-colors duration-200 ${on ? "text-volt" : "text-slate-500 group-hover:text-slate-300"}`}>{t.icon("h-4 w-4")}</span>
                  <span className={on ? "" : "hidden xl:inline"}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile: current section + menu button */}
        <div className="flex items-center gap-3 md:hidden">
          <span className="hidden max-w-[9rem] truncate text-xs font-semibold uppercase tracking-wider text-slate-400 min-[400px]:block">{active.label}</span>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="nav-drawer"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-slate-200 transition active:scale-95"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        id="nav-drawer"
        className={`absolute inset-x-0 top-full z-10 origin-top border-b border-line bg-ink transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
          menuOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <nav aria-label="Main">
          <ul className="divide-y divide-line">
            {tabs.map((t, i) => {
              const on = t.id === activeTab;
              return (
                <li key={t.id} className={menuOpen ? "nav-drawer-item" : ""} style={{ animationDelay: `${30 + i * 35}ms` }}>
                  <button
                    onClick={() => go(t.id)}
                    aria-current={on ? "page" : undefined}
                    tabIndex={menuOpen ? 0 : -1}
                    className={`relative flex w-full items-center gap-4 px-5 py-4 text-left transition active:bg-white/[0.04] ${on ? "text-white" : "text-slate-300"}`}
                  >
                    {on && <span className="absolute inset-y-3 left-0 w-[3px] bg-volt" aria-hidden />}
                    <span className={on ? "text-volt" : "text-slate-500"}>{t.icon("h-5 w-5")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-xl font-bold uppercase leading-tight tracking-wide">{t.label}</span>
                      <span className="block truncate text-xs text-slate-500">{t.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Tap-away layer behind the sheet */}
      {menuOpen && <div className="fixed inset-0 top-[60px] -z-10 bg-black/60 md:hidden" onClick={() => setMenuOpen(false)} aria-hidden />}
    </header>
  );
}
