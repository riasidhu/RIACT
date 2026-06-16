"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import BurnoutBanner from "@/components/BurnoutBanner";
import { createClient } from "@/lib/supabase";
import { checkBurnout } from "@/lib/burnout";
import { getGoalProgress } from "@/lib/goals";
import { formatMinutes } from "@/lib/utils";
import type { AnalysisResult, Break, Goal, Session } from "@/lib/types";
import { Brain, ExternalLink, Lightbulb, ShieldAlert, Target } from "lucide-react";

const RESOURCES = [
  {
    title: "Pomodoro Technique",
    url: "https://todoist.com/productivity-methods/pomodoro-technique",
    desc: "25-minute focused work intervals with short breaks",
  },
  {
    title: "Active Recall & Spaced Repetition",
    url: "https://ncase.me/remember/",
    desc: "Evidence-based study methods for long-term retention",
  },
  {
    title: "NAMI Mental Health Support",
    url: "https://www.nami.org/help",
    desc: "National Alliance on Mental Illness — helpline & resources",
  },
  {
    title: "Crisis Text Line",
    url: "https://www.crisistextline.org/",
    desc: "Text HOME to 741741 for free, 24/7 crisis support",
  },
  {
    title: "Time Management for Students",
    url: "https://learningcenter.unc.edu/tips-and-tools/time-management/",
    desc: "Planning and prioritization strategies from UNC",
  },
];

export default function InsightsPage() {
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (user.email) setUserEmail(user.email);

      const [{ data: sess }, { data: brks }, { data: gols }] = await Promise.all([
        supabase.from("sessions").select("*"),
        supabase.from("breaks").select("*"),
        supabase.from("goals").select("*"),
      ]);

      setSessions(sess ?? []);
      setBreaks(brks ?? []);
      setGoals(gols ?? []);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id }),
        });

        if (res.ok) {
          const data = await res.json();
          setAnalysis(data);
        }
      } catch (err) {
        console.error("AI analysis failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const burnout = checkBurnout(sessions, breaks, goals);
  const goalProgress = getGoalProgress(
    goals.filter((g) => g.is_active),
    sessions
  );

  const riskConfig = {
    low: { label: "Low Risk", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    medium: { label: "Medium Risk", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    high: { label: "High Risk", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  };

  return (
    <AppLayout userEmail={userEmail}>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Insights</h1>
          <p className="mt-1 text-slate-500 text-sm">AI-powered analysis of your study patterns</p>
        </div>

        {/* Burnout banner */}
        <div className="mb-6">
          <BurnoutBanner signals={burnout.signals} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* AI Recommendations */}
          <section className="rounded-xl bg-white border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50">
                <Brain size={15} className="text-pink-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">AI Recommendations</h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                <p className="text-xs text-slate-400 mt-4">Analyzing your study patterns...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                  <p className="text-xs font-semibold text-pink-500 uppercase tracking-wide mb-1">Pattern Summary</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{analysis.patterns}</p>
                </div>
                {analysis.recommendations?.length > 0 && (
                  <ul className="space-y-2">
                    {analysis.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-600">
                        <span className="text-pink-400 mt-0.5 shrink-0">→</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-5 text-center">
                <Lightbulb size={20} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Log at least 3 sessions to unlock AI-powered insights.</p>
              </div>
            )}
          </section>

          {/* Goal Performance */}
          <section className="rounded-xl bg-white border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                <Target size={15} className="text-purple-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Goal Performance</h2>
            </div>

            {goalProgress.length === 0 ? (
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-5 text-center">
                <Target size={20} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No active goals. Create one on the Goals page.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {goalProgress.map(({ goal, studiedMinutes, targetMinutes, percent }) => (
                  <li key={goal.id} className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {goal.target_hours}h {goal.timeframe}
                        {goal.location_name ? ` · ${goal.location_name}` : ""}
                      </p>
                      <span className={`text-xs font-semibold ${percent >= 100 ? "text-green-600" : "text-amber-500"}`}>
                        {Math.round(percent)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 mb-2">
                      <div
                        className={`h-1.5 rounded-full transition-all ${percent >= 100 ? "bg-green-400" : "bg-pink-400"}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatMinutes(studiedMinutes)} / {formatMinutes(targetMinutes)} studied
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Burnout Risk */}
          <section className="rounded-xl bg-white border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <ShieldAlert size={15} className="text-red-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Burnout Risk</h2>
            </div>

            {analysis ? (
              <div className="space-y-4">
                {(() => {
                  const cfg = riskConfig[analysis.burnout_risk] ?? riskConfig.low;
                  return (
                    <div className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${analysis.burnout_risk === "low" ? "bg-green-500" : analysis.burnout_risk === "medium" ? "bg-amber-500" : "bg-red-500"}`} />
                      {cfg.label}
                    </div>
                  );
                })()}

                {analysis.burnout_signals?.length > 0 && (
                  <ul className="space-y-1.5">
                    {analysis.burnout_signals.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-600">
                        <span className="text-slate-300 mt-0.5 shrink-0">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-400 leading-relaxed">
                  RIACT detects burnout signals but does not provide medical diagnoses. If you feel overwhelmed, please reach out to campus counseling services.
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-5 text-center">
                <ShieldAlert size={20} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  {loading ? "Assessing burnout risk..." : "Insufficient data for burnout assessment."}
                </p>
              </div>
            )}
          </section>

          {/* Resources */}
          <section className="rounded-xl bg-white border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <ExternalLink size={15} className="text-blue-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Resources</h2>
            </div>

            <ul className="space-y-3">
              {RESOURCES.map((r) => (
                <li key={r.url} className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-pink-500 hover:text-pink-600 flex items-center gap-1"
                  >
                    {r.title}
                    <ExternalLink size={10} />
                  </a>
                  <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
