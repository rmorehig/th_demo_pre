"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { TopPagesOutput, PageViewsRow } from "@/lib/tinybird";

// Color mapping for different pages
const pageColors: Record<string, string> = {
  "/home": "bg-green-500",
  "/pricing": "bg-blue-500",
  "/about": "bg-purple-500",
  "/docs": "bg-orange-500",
};

const pages = [
  { pathname: "/home", label: "Home", color: "bg-green-600 hover:bg-green-700", streakColor: "bg-green-800" },
  { pathname: "/pricing", label: "Pricing", color: "bg-blue-600 hover:bg-blue-700", streakColor: "bg-blue-800" },
  { pathname: "/about", label: "About", color: "bg-purple-600 hover:bg-purple-700", streakColor: "bg-purple-800" },
  { pathname: "/docs", label: "Docs", color: "bg-orange-600 hover:bg-orange-700", streakColor: "bg-orange-800" },
];

export default function Home() {
  const [topPages, setTopPages] = useState<TopPagesOutput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Click streak state
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const fetchAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setTopPages(data.topPages);
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const trackPageView = async (pathname: string) => {
    const event: PageViewsRow = {
      timestamp: new Date(),
      session_id: crypto.randomUUID(),
      pathname,
      referrer: null,
    };

    // Update streak
    if (timeoutRefs.current[pathname]) {
      clearTimeout(timeoutRefs.current[pathname]);
    }
    setStreaks((prev) => ({ ...prev, [pathname]: (prev[pathname] ?? 0) + 1 }));
    timeoutRefs.current[pathname] = setTimeout(() => {
      setStreaks((prev) => ({ ...prev, [pathname]: 0 }));
    }, 1500);

    try {
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: event }),
      });
    } catch (e) {
      console.error("Failed to track:", e);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <main className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
          @tinybirdco/sdk Demo
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Real-time analytics powered by the Tinybird TypeScript SDK.
        </p>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          {pages.map((page) => (
            <button
              key={page.pathname}
              onClick={() => trackPageView(page.pathname)}
              className={`relative px-6 py-3 ${page.color} text-white rounded-lg font-medium transition-transform active:scale-95`}
            >
              Track {page.label}
              {(streaks[page.pathname] ?? 0) > 0 && (
                <span className={`absolute -top-2 -right-2 ${page.streakColor} text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce`}>
                  +{streaks[page.pathname]}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Top Pages Chart */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Top Pages
            </h2>
            <button
              onClick={fetchAnalytics}
              disabled={isRefreshing}
              className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <svg
                className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
          {topPages.length === 0 ? (
            <p className="text-zinc-500">
              No data yet. Click a button above to track a page view.
            </p>
          ) : (
            <div className="space-y-4">
              {topPages.map((page, i) => {
                const maxCount = Math.max(
                  ...topPages.map((p) => p.views)
                );
                const percentage = (page.views / maxCount) * 100;
                const barColor =
                  pageColors[page.pathname] || "bg-purple-500";
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-900 dark:text-white font-medium">
                        {page.pathname}
                      </span>
                      <span className="text-zinc-500">
                        {page.views.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
