"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import Modal from "@/components/Modal";
import { createClient } from "@/lib/supabase";
import { formatDateTime, toDatetimeLocal } from "@/lib/utils";
import type { Break, Session } from "@/lib/types";
import { differenceInSeconds, parseISO } from "date-fns";
import { Clock, Coffee, MapPin, Square } from "lucide-react";

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function ActiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState<Session | null>(null);
  const [breaks, setBreaks] = useState<Break[]>([]);
  
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [endBreakModalOpen, setEndBreakModalOpen] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(toDatetimeLocal());
  const [breakEndTime, setBreakEndTime] = useState(toDatetimeLocal());
  const [activeBreak, setActiveBreak] = useState<Break | null>(null);

  const computeElapsed = useCallback((sess: Session, brks: Break[], now: Date) => {
    const start = parseISO(sess.start_time);
    let totalSeconds = differenceInSeconds(now, start);

    for (const b of brks) {
      if (b.end_time) {
        totalSeconds -= differenceInSeconds(parseISO(b.end_time), parseISO(b.start_time));
      } else {
        totalSeconds -= differenceInSeconds(now, parseISO(b.start_time));
      }
    }

    return Math.max(0, totalSeconds);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) { router.replace("/auth"); return; }

      const { data: sess } = await supabase.from("sessions").select("*").eq("id", id).single();
      if (!sess) return;

      if (sess.end_time) {
        router.replace(`/session/${id}/review`);
        return;
      }

      const { data: brks } = await supabase
        .from("breaks")
        .select("*")
        .eq("session_id", id)
        .order("start_time");

      setSession(sess);
      setBreaks(brks ?? []);

      const openBreak = (brks ?? []).find((b: Break) => !b.end_time) ?? null;
      setActiveBreak(openBreak);
      setIsPaused(!!openBreak);
    }
    load();
  }, [id, supabase, router]);

  useEffect(() => {
    if (!session) return;

    const tick = () => {
      const now = new Date();
      setElapsed(computeElapsed(session, breaks, now));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session, breaks, computeElapsed]);

  async function handleStartBreak() {
    if (!session) return;

    const { data, error } = await supabase
      .from("breaks")
      .insert({
        session_id: session.id,
        start_time: new Date(breakStartTime).toISOString(),
      })
      .select()
      .single();

    if (error || !data) return;

    setBreaks((prev) => [...prev, data]);
    setActiveBreak(data);
    setIsPaused(true);
    setBreakModalOpen(false);
  }

  async function handleEndBreak() {
    if (!activeBreak) return;

    const start = parseISO(activeBreak.start_time);
    const end = new Date(breakEndTime);
    const durationMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));

    const { data, error } = await supabase
      .from("breaks")
      .update({
        end_time: end.toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq("id", activeBreak.id)
      .select()
      .single();

    if (error || !data) return;

    setBreaks((prev) => prev.map((b) => (b.id === data.id ? data : b)));
    setActiveBreak(null);
    setIsPaused(false);
    setEndBreakModalOpen(false);
  }

  async function handleEndSession() {
    if (!session) return;
    const now = new Date().toISOString();
    await supabase.from("sessions").update({ end_time: now }).eq("id", session.id);
    router.push(`/session/${id}/review`);
  }

  if (!session) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-400 text-sm">Loading session…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex max-w-sm flex-col items-center py-6">

        {/* Location + projected end */}
        <div className="w-full rounded-xl bg-white border border-slate-100 shadow-sm p-4 mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-50">
            <MapPin size={16} className="text-pink-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{session.location_name}</p>
            <p className="text-xs text-slate-400">
              Projected end:{" "}
              {session.projected_end_time ? formatDateTime(session.projected_end_time) : "—"}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="w-full rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-xl shadow-pink-200 p-8 mb-6 text-center">
          <p className="text-xs font-semibold text-pink-200 uppercase tracking-widest mb-3">
            {isPaused ? "On Break" : "Study Time"}
          </p>
          <div className="font-mono text-6xl font-bold text-white tabular-nums tracking-tight">
            {formatTimer(elapsed)}
          </div>
          {isPaused && (
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
              <p className="text-xs text-pink-100">Timer paused during break</p>
            </div>
          )}
          {!isPaused && (
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
              <p className="text-xs text-pink-100">Session in progress</p>
            </div>
          )}
        </div>

        {/* Break count */}
        {breaks.length > 0 && (
          <div className="w-full rounded-xl bg-white border border-slate-100 shadow-sm px-4 py-3 mb-6 flex items-center gap-2">
            <Coffee size={14} className="text-slate-400" />
            <p className="text-sm text-slate-500">
              {breaks.length} break{breaks.length !== 1 ? "s" : ""} taken
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="w-full space-y-3">
          {activeBreak ? (
            <button
              onClick={() => {
                setBreakEndTime(toDatetimeLocal());
                setEndBreakModalOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <Clock size={15} />
              End Break & Resume
            </button>
          ) : (
            <button
              onClick={() => {
                setBreakStartTime(toDatetimeLocal());
                setBreakModalOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Coffee size={15} />
              Record Break
            </button>
          )}

          <button
            onClick={handleEndSession}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 hover:from-red-400 hover:to-red-500 transition-all"
          >
            <Square size={13} fill="white" />
            End Session
          </button>
        </div>
      </div>

      {/* Break modal */}
      <Modal open={breakModalOpen} title="Record Break" onClose={() => setBreakModalOpen(false)}>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Break start time</span>
          <input
            type="datetime-local"
            value={breakStartTime}
            onChange={(e) => setBreakStartTime(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300 transition-colors"
          />
        </label>
        <button
          onClick={handleStartBreak}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-pink-500 transition-all"
        >
          Start Break
        </button>
      </Modal>

      {/* End break modal */}
      <Modal open={endBreakModalOpen} title="End Break" onClose={() => setEndBreakModalOpen(false)}>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Break end time</span>
          <input
            type="datetime-local"
            value={breakEndTime}
            onChange={(e) => setBreakEndTime(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300 transition-colors"
          />
        </label>
        <button
          onClick={handleEndBreak}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-pink-500 transition-all"
        >
          End Break & Resume Timer
        </button>
      </Modal>
    </AppLayout>
  );
}
