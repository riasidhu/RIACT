export const dynamic = "force-dynamic";

import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import GoalProgressBars from "@/components/GoalProgressBar";
import { createServerSupabase } from "@/lib/supabase-server";
import { getGoalProgress } from "@/lib/goals";
import { formatMinutes, isToday } from "@/lib/utils";
import LocalTime from "@/components/LocalTime";
import QuoteCard from "@/components/QuoteCard";
import type { Session } from "@/lib/types";
import { BookOpen, Clock, MapPin, Plus, TrendingUp, Flame, Brain, Target, Lightbulb } from "lucide-react";

const tips = [
  { icon: "🧠", title: "Location matters", body: "Studying in the same spot trains your brain to focus. RIACT tracks which locations work best for you." },
  { icon: "⏱️", title: "Log your breaks", body: "Breaks aren't wasted time. Tracking them helps RIACT understand your true productivity patterns." },
  { icon: "🎯", title: "Set a daily goal", body: "Students with goals study 40% more consistently. Head to Goals to set your first target." },
  { icon: "📊", title: "3 sessions to insights", body: "After 3 logged sessions, RIACT's AI will start detecting your patterns and giving recommendations." },
];

export default async function HomePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: sessions }, { data: goals }] = await Promise.all([
    supabase.from("sessions").select("*").order("start_time", { ascending: false }),
    supabase.from("goals").select("*"),
  ]);

  const allSessions = (sessions ?? []) as Session[];
  const todaySessions = allSessions.filter((s) => isToday(s.start_time));
  const hasSessionsToday = todaySessions.length > 0;
  const goalProgress = getGoalProgress(goals ?? [], allSessions);

  const firstName = user?.email?.split("@")[0] ?? "there";
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const totalMinutesToday = todaySessions.filter((s) => s.end_time).reduce((sum, s) => sum + (s.net_study_minutes ?? 0), 0);
  const uniqueLocationsToday = new Set(todaySessions.map((s) => s.location_name)).size;

  // Streak calculation
  const streak = (() => {
    let count = 0;
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const hadSession = allSessions.some((s) => s.end_time && s.start_time.startsWith(dateStr));
      if (hadSession) count++;
      else break;
    }
    return count;
  })();

  const totalSessions = allSessions.filter((s) => s.end_time).length;

  return (
    <AppLayout>
      <div className="max-w-4xl">
        {/* Greeting */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {greeting}, {displayName}
            </h1>
            <p className="mt-1 text-slate-500 text-sm">
              {hasSessionsToday
                ? `You've studied for ${formatMinutes(totalMinutesToday)} today — keep it up!`
                : "Ready to start your first session today?"}
            </p>
          </div>
          <Link href="/session/new">
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-pink-500 transition-all duration-150 whitespace-nowrap">
              <Plus size={15} />
              {hasSessionsToday ? "Add Session" : "Begin Session"}
            </button>
          </Link>
        </div>

        {/* Stats row — always visible */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50">
                <Clock size={15} className="text-pink-500" />
              </div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Today</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatMinutes(totalMinutesToday)}</p>
            <p className="text-xs text-slate-400 mt-0.5">net study time</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50">
                <BookOpen size={15} className="text-pink-500" />
              </div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Sessions</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalSessions}</p>
            <p className="text-xs text-slate-400 mt-0.5">all time</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                <Flame size={15} className="text-orange-400" />
              </div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Streak</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{streak}</p>
            <p className="text-xs text-slate-400 mt-0.5">days in a row</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                <MapPin size={15} className="text-purple-400" />
              </div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Locations</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{uniqueLocationsToday}</p>
            <p className="text-xs text-slate-400 mt-0.5">today</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left column */}
          <div className="col-span-2 space-y-6">
            {/* Goals */}
            {goalProgress.length > 0 && (
              <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target size={15} className="text-pink-500" />
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Active Goals</h2>
                  </div>
                  <Link href="/goals" className="text-xs text-pink-500 hover:text-pink-600">View all →</Link>
                </div>
                <GoalProgressBars items={goalProgress} />
              </div>
            )}

            {/* Today's sessions */}
            {hasSessionsToday && (
              <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={15} className="text-pink-500" />
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Today's Sessions</h2>
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {todaySessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${session.end_time ? "bg-pink-50" : "bg-green-50"}`}>
                          <MapPin size={13} className={session.end_time ? "text-pink-400" : "text-green-400"} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-800">{session.location_name}</p>
                            {!session.end_time && (
                              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                                In progress
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            <LocalTime iso={session.start_time} />{session.end_time ? <> – <LocalTime iso={session.end_time} /></> : " – now"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {session.end_time ? (
                          <>
                            <p className="text-sm font-semibold text-pink-500">{formatMinutes(session.net_study_minutes ?? 0)}</p>
                            <p className="text-xs text-slate-400">{formatMinutes(session.total_minutes ?? 0)} total</p>
                          </>
                        ) : (
                          <p className="text-xs text-slate-400">Active</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state tips */}
            {!hasSessionsToday && (
              <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={15} className="text-pink-500" />
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">How RIACT Works</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {tips.map((tip, i) => (
                    <div key={i} className="rounded-lg bg-slate-50 p-4">
                      <p className="text-lg mb-1">{tip.icon}</p>
                      <p className="text-sm font-semibold text-slate-800 mb-1">{tip.title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{tip.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Quote card */}
            <QuoteCard />

            {/* Quick links */}
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Quick Links</h3>
              <div className="space-y-1">
                {[
                  { href: "/goals", label: "Set a study goal", icon: Target },
                  { href: "/locations", label: "Add a location", icon: MapPin },
                  { href: "/dashboard", label: "View dashboard", icon: TrendingUp },
                  { href: "/insights", label: "See insights", icon: Brain },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    <Icon size={14} className="text-slate-400" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* AI status */}
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">AI Status</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-2 w-2 rounded-full ${totalSessions >= 3 ? "bg-green-400" : "bg-amber-400"}`} />
                <p className="text-sm font-medium text-slate-700">
                  {totalSessions >= 3 ? "AI Active" : "Warming Up"}
                </p>
              </div>
              <p className="text-xs text-slate-400">
                {totalSessions >= 3
                  ? "RIACT is analyzing your patterns."
                  : `${3 - totalSessions} more session${3 - totalSessions === 1 ? "" : "s"} needed to activate AI insights.`}
              </p>
              {totalSessions < 3 && (
                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all"
                    style={{ width: `${(totalSessions / 3) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
