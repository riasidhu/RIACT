"use client";

import { useEffect, useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek, subDays } from "date-fns";
import AppLayout from "@/components/AppLayout";
import BurnoutBanner from "@/components/BurnoutBanner";
import LocationPieChart from "@/components/LocationPieChart";
import { createClient } from "@/lib/supabase";
import { checkBurnout } from "@/lib/burnout";
import { formatMinutes, sessionsInRange, getDayRange, getWeekRange } from "@/lib/utils";
import type { Break, Goal, Session } from "@/lib/types";
import { BarChart2, Brain, Calendar, Clock, MapPin, Sparkles, TrendingUp } from "lucide-react";

interface WeeklyPlanDay {
  day: string;
  hours: number;
  location: string;
  focus: string;
}

function aggregateByLocation(sessions: Session[]) {
  const map = new Map<string, { net: number; total: number; breaks: number }>();
  for (const s of sessions) {
    const cur = map.get(s.location_name) ?? { net: 0, total: 0, breaks: 0 };
    cur.net += s.net_study_minutes ?? 0;
    cur.total += s.total_minutes ?? 0;
    map.set(s.location_name, cur);
  }
  return map;
}

export default function DashboardPage() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedWeek, setSelectedWeek] = useState(format(new Date(), "yyyy-MM-dd"));
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<{ summary: string; days: WeeklyPlanDay[] } | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      

      const [{ data: sess }, { data: brks }, { data: gols }] = await Promise.all([
        supabase.from("sessions").select("*").not("end_time", "is", null),
        supabase.from("breaks").select("*"),
        supabase.from("goals").select("*"),
      ]);

      setSessions(sess ?? []);
      setBreaks(brks ?? []);
      setGoals(gols ?? []);
    }
    load();
  }, [supabase]);

  const yesterday = subDays(new Date(), 1);
  const yesterdayRange = getDayRange(yesterday);
  const yesterdaySessions = sessionsInRange(sessions, yesterdayRange.start, yesterdayRange.end);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of yesterdaySessions) {
      map.set(s.location_name, (map.get(s.location_name) ?? 0) + (s.net_study_minutes ?? 0) / 60);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }));
  }, [yesterdaySessions]);

  const totalHours = useMemo(
    () => Math.round((sessions.reduce((s, x) => s + (x.net_study_minutes ?? 0), 0) / 60) * 10) / 10,
    [sessions]
  );

  const dayDate = new Date(selectedDate + "T12:00:00");
  const dayRange = getDayRange(dayDate);
  const daySessions = sessionsInRange(sessions, dayRange.start, dayRange.end);
  const dayAgg = aggregateByLocation(daySessions);

  const weekDate = new Date(selectedWeek + "T12:00:00");
  const weekRange = getWeekRange(weekDate);
  const weekSessions = sessionsInRange(sessions, weekRange.start, weekRange.end);
  const weekAgg = aggregateByLocation(weekSessions);

  const burnout = checkBurnout(sessions, breaks, goals);

  const weekBreakCount = useMemo(() => {
    const ids = new Set(weekSessions.map((s) => s.id));
    return breaks.filter((b) => ids.has(b.session_id)).length;
  }, [weekSessions, breaks]);

  async function loadWeeklyRecommendations() {
    setLoadingRecs(true);
    try {
      // getSession() reads localStorage — fast, no network call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: session.user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.recommendations) setRecommendations(data.recommendations);
      } else {
        console.error("AI recommendations returned", res.status);
      }
    } catch (err) {
      console.error("AI recommendations failed:", err);
    } finally {
      setLoadingRecs(false);
    }
  }

  async function generateWeeklyPlan() {
    setLoadingPlan(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      const res = await fetch("/api/weekly-plan", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ user_id: session.user.id }),
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        setWeeklyPlan(data);
      }
    } catch (err) {
      console.error("Weekly plan failed:", err);
    } finally {
      setLoadingPlan(false);
    }
  }

  useEffect(() => {
    loadWeeklyRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-slate-500 text-sm">Your study data at a glance</p>
        </div>

        {/* Burnout banner */}
        <div className="mb-6">
          <BurnoutBanner signals={burnout.signals} />
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50">
                <Clock size={15} className="text-pink-500" />
              </div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">All-Time Hours</span>
            </div>
            <p className="text-4xl font-bold text-slate-900">{totalHours}<span className="text-xl text-slate-400">h</span></p>
            <p className="text-xs text-slate-400 mt-1">total net study time</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                <TrendingUp size={15} className="text-purple-400" />
              </div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total Sessions</span>
            </div>
            <p className="text-4xl font-bold text-slate-900">{sessions.length}</p>
            <p className="text-xs text-slate-400 mt-1">logged sessions</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <BarChart2 size={15} className="text-blue-400" />
              </div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">This Week</span>
            </div>
            <p className="text-4xl font-bold text-slate-900">
              {Math.round((weekSessions.reduce((s, x) => s + (x.net_study_minutes ?? 0), 0) / 60) * 10) / 10}
              <span className="text-xl text-slate-400">h</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">net this week</p>
          </div>
        </div>

        {/* Pie chart */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={15} className="text-pink-500" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Hours by Location (Yesterday)</h2>
            </div>
            {pieData.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No sessions logged yesterday</p>
            ) : (
              <LocationPieChart data={pieData} />
            )}
          </div>

          {/* Daily report */}
          <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-pink-500" />
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Daily Report</h2>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
              />
            </div>

            <p className="mb-4 text-3xl font-bold text-pink-500">
              {formatMinutes(daySessions.reduce((s, x) => s + (x.net_study_minutes ?? 0), 0))}
            </p>

            {dayAgg.size === 0 ? (
              <p className="text-sm text-slate-400">No sessions on this date</p>
            ) : (
              <ul className="space-y-2">
                {Array.from(dayAgg.entries()).map(([loc, stats]) => {
                  const locBreaks = breaks.filter((b) =>
                    daySessions.some((s) => s.id === b.session_id && s.location_name === loc)
                  ).length;
                  return (
                    <li key={loc} className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-sm">
                      <p className="font-semibold text-slate-800">{loc}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Net: {formatMinutes(stats.net)} · Total: {formatMinutes(stats.total)} · {locBreaks} break{locBreaks !== 1 ? "s" : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Weekly report */}
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-pink-500" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Weekly Report</h2>
            </div>
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
            />
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Week of {format(startOfWeek(weekDate, { weekStartsOn: 1 }), "MMM d")} –{" "}
            {format(endOfWeek(weekDate, { weekStartsOn: 1 }), "MMM d")}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs text-slate-400 mb-1">Net Study Time</p>
              <p className="text-2xl font-bold text-pink-500">
                {Math.round((weekSessions.reduce((s, x) => s + (x.net_study_minutes ?? 0), 0) / 60) * 10) / 10}h
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs text-slate-400 mb-1">Sessions</p>
              <p className="text-2xl font-bold text-slate-800">{weekSessions.length}</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs text-slate-400 mb-1">Total Breaks</p>
              <p className="text-2xl font-bold text-slate-800">{weekBreakCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {weekAgg.size > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">By Location</h3>
                <ul className="space-y-2">
                  {Array.from(weekAgg.entries()).map(([loc, stats]) => (
                    <li key={loc} className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-sm">
                      <p className="font-semibold text-slate-800">{loc}</p>
                      <p className="text-slate-500 text-xs">{formatMinutes(stats.net)} net study time</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">AI Recommendations</h3>
              {loadingRecs ? (
                <p className="text-sm text-slate-400">Analyzing your patterns...</p>
              ) : recommendations.length === 0 ? (
                <p className="text-sm text-slate-400">Log more sessions to get AI insights</p>
              ) : (
                <ul className="space-y-2">
                  {recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600">
                      <span className="text-pink-400 mt-0.5">→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* AI Weekly Plan */}
          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain size={15} className="text-pink-500" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">AI Study Plan</h3>
              </div>
              <button
                onClick={generateWeeklyPlan}
                disabled={loadingPlan}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-pink-200 hover:from-pink-400 hover:to-pink-500 disabled:opacity-50 transition-all"
              >
                <Brain size={11} />
                {loadingPlan ? "Generating…" : weeklyPlan ? "Regenerate" : "Generate AI Plan"}
              </button>
            </div>

            {loadingPlan && (
              <p className="text-sm text-slate-400">Building your personalised plan…</p>
            )}

            {!loadingPlan && weeklyPlan && (
              <div>
                <p className="text-sm text-slate-600 mb-4 italic">{weeklyPlan.summary}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                        <th className="text-left py-2 pr-4 font-medium">Day</th>
                        <th className="text-left py-2 pr-4 font-medium">Hours</th>
                        <th className="text-left py-2 pr-4 font-medium">Location</th>
                        <th className="text-left py-2 font-medium">Focus Tip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {weeklyPlan.days.map((d) => (
                        <tr key={d.day} className={d.hours === 0 ? "opacity-40" : ""}>
                          <td className="py-2.5 pr-4 font-semibold text-slate-800">{d.day.slice(0, 3)}</td>
                          <td className="py-2.5 pr-4">
                            {d.hours === 0 ? (
                              <span className="text-slate-400">Rest</span>
                            ) : (
                              <span className="font-medium text-pink-500">{d.hours}h</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-4 text-slate-600">{d.location || "—"}</td>
                          <td className="py-2.5 text-slate-500 text-xs">{d.focus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loadingPlan && !weeklyPlan && (
              <p className="text-sm text-slate-400">Click "Generate AI Plan" to get a personalised Mon–Sun study schedule based on your habits.</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
