"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import GoalProgressBars from "@/components/GoalProgressBar";
import { createClient } from "@/lib/supabase";
import { getGoalProgress } from "@/lib/goals";
import type { Goal, Session } from "@/lib/types";
import { CheckCircle, Clock, Plus, RotateCcw, Target } from "lucide-react";

export default function GoalsPage() {
  const supabase = createClient();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  const [targetHours, setTargetHours] = useState("2");
  const [timeframe, setTimeframe] = useState<"daily" | "weekly">("daily");
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    

    const [{ data: gols }, { data: sess }] = await Promise.all([
      supabase.from("goals").select("*").order("created_at", { ascending: false }),
      supabase.from("sessions").select("*"),
    ]);
    setGoals(gols ?? []);
    setSessions(sess ?? []);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("goals").insert({
      user_id: user.id,
      target_hours: parseFloat(targetHours),
      timeframe,
      location_name: locationName.trim() || null,
      is_active: true,
    });

    setTargetHours("2");
    setLocationName("");
    setLoading(false);
    loadData();
  }

  async function handleReplicate(goal: Goal) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("goals").insert({
      user_id: user.id,
      target_hours: goal.target_hours,
      timeframe: goal.timeframe,
      location_name: goal.location_name,
      is_active: true,
    });
    loadData();
  }

  async function handleDeactivate(id: string) {
    await supabase.from("goals").update({ is_active: false }).eq("id", id);
    loadData();
  }

  const activeGoals = goals.filter((g) => g.is_active);
  const pastGoals = goals.filter((g) => !g.is_active);
  const progress = getGoalProgress(activeGoals, sessions);

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300 transition-colors";

  return (
    <AppLayout>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Goals</h1>
          <p className="mt-1 text-slate-500 text-sm">Set study targets and track your progress</p>
        </div>

        {/* Create Goal form */}
        <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50">
              <Plus size={15} className="text-pink-500" />
            </div>
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Create New Goal</h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Target hours</span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={targetHours}
                  onChange={(e) => setTargetHours(e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Timeframe</span>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as "daily" | "weekly")}
                  className={inputClass}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location (optional)</span>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Any location"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-400">Leave blank to apply to any location</p>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-pink-500 disabled:opacity-50 transition-all duration-150"
            >
              <Plus size={14} />
              {loading ? "Saving..." : "Save Goal"}
            </button>
          </form>
        </div>

        {/* Active goals with progress */}
        {progress.length > 0 && (
          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                <Target size={15} className="text-purple-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Active Goals</h2>
            </div>
            <GoalProgressBars items={progress} />
          </div>
        )}

        {/* Manage active goals */}
        {activeGoals.length > 0 && (
          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                <CheckCircle size={15} className="text-green-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Manage Active Goals</h2>
            </div>
            <ul className="space-y-2">
              {activeGoals.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200">
                      <Clock size={12} className="text-pink-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-800">
                      {g.target_hours}h {g.timeframe}
                      {g.location_name ? (
                        <span className="text-slate-400"> · {g.location_name}</span>
                      ) : null}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeactivate(g.id)}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium"
                  >
                    Mark complete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Past goals */}
        {pastGoals.length > 0 && (
          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
                <RotateCcw size={15} className="text-slate-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Previous Goals</h2>
            </div>
            <ul className="space-y-2">
              {pastGoals.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3"
                >
                  <span className="text-sm text-slate-400">
                    {g.target_hours}h {g.timeframe}
                    {g.location_name ? ` · ${g.location_name}` : ""}
                  </span>
                  <button
                    onClick={() => handleReplicate(g)}
                    className="flex items-center gap-1.5 text-xs text-pink-500 hover:text-pink-600 font-medium transition-colors"
                  >
                    <RotateCcw size={11} />
                    Replicate
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty state */}
        {activeGoals.length === 0 && pastGoals.length === 0 && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-8 text-center">
            <Target size={24} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-1">No goals yet</p>
            <p className="text-xs text-slate-400">Create your first study goal above to start tracking your progress.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
