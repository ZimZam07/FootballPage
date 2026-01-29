"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Trophy } from "lucide-react";
import { useTheme } from "next-themes";

interface NavbarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const tabs = [
    { id: "live", label: "Watch Live Matches" },
    { id: "highlights", label: "Recent Highlights" },
    { id: "creators", label: "Indian Creators" },
    { id: "big", label: "Big Class Matches" },
];

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-900/80 backdrop-blur-md dark:bg-slate-950/80">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 text-xl font-bold text-teal-500">
                    <Trophy className="h-6 w-6" />
                    <span>Football Hub</span>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeTab === tab.id
                                    ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Toggle theme"
                >
                    {mounted && (theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />)}
                </button>
            </div>

            {/* Mobile Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-1 border-t border-white/5 p-2 md:hidden">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${activeTab === tab.id
                                ? "bg-teal-500 text-white"
                                : "text-slate-400 hover:text-white"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </nav>
    );
}
