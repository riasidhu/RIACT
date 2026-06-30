"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { differenceInSeconds, parseISO } from "date-fns";
import { Coffee, MapPin, Square } from "lucide-react";

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface ActiveSession {
  id: string;
  location_name: string;
  start_time: string;
  end_time: string | null;
}

interface ActiveBreak {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
}

export default function ActiveSessionBanner() {
  const supabase = createClient();
  const router = useRouter();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [breaks, setBreaks] = useState<ActiveBreak[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);

  const computeElapsed = useCallback(
    (sess: ActiveSession, brks: ActiveBreak[], now: Date) => {
      const start = parseISO(sess.start_time);
      let total = differenceInSeconds(now, start);
      for (const b of brks) {
        if (b.end_time) {
          total -= differenceInSeconds(parseISO(b.end_time), parseISO(b.start_time));
        } else {
          total -= differenceInSeconds(now, parseISO(b.start_time));
        }
      }
      return Math.max(0, total);
    },
    []
  );

  async function fetchActive() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSession(null); return; }

    const { data: sess } = await supabase
      .from("sessions")
      .select("id, location_name, start_time, end_time")
      .eq("user_id", user.id)
      .is("end_time", null)
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sess) { setSession(null); return; }

    const { data: brks } = await supabase
      .from("breaks")
      .select("id, start_time, end_time, duration_minutes")
      .eq("session_id", sess.id)
      .order("start_time");

    setSession(sess);
    setBreaks(brks ?? []);
  }

  useEffect(() => {
    fetchActive();
    // Re-check every 30s in case the session was ended elsewhere
    const poll = setInterval(fetchActive, 30_000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!session) return;
    const tick = () => setElapsed(computeElapsed(session, breaks, new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session, breaks, computeElapsed]);

  async function handleEndSession() {
    if (!session) return;
    setEnding(true);
    await supabase.from("sessions").update({ end_time: new Date().toISOString() }).eq("id", session.id);
    router.push(`/session/${session.id}/review`);
  }

  if (!session) return null;

  const onBreak = breaks.some((b) => !b.end_time);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md md:left-[calc(130px+50%)] md:-translate-x-1/2">
      <div
        className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl shadow-pink-500/20 border ${
          onBreak
            ? "bg-amber-50 border-amber-200"
            : "bg-white border-pink-200"
        }`}
      >
        {/* Pulse dot */}
        <div className="relative shrink-0">
          <div className={`h-2.5 w-2.5 rounded-full ${onBreak ? "bg-amber-400" : "bg-green-400"}`} />
          <div className={`absolute inset-0 rounded-full animate-ping ${onBreak ? "bg-amber-400" : "bg-green-400"} opacity-50`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <MapPin size={11} className="text-pink-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 truncate">{session.location_name}</span>
            {onBreak && <span className="text-[10px] text-amber-600 font-medium ml-1">· On break</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-sm font-bold text-slate-900">{formatTimer(elapsed)}</span>
            <span className="text-[10px] text-slate-400">net study time</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onBreak && (
            <div className="flex items-center gap-1 text-[10px] text-amber-600">
              <Coffee size={11} />
              break
            </div>
          )}
          <button
            onClick={() => router.push(`/session/${session.id}`)}
            className="rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:from-pink-400 hover:to-pink-500 transition-all"
          >
            Resume →
          </button>
          <button
            onClick={handleEndSession}
            disabled={ending}
            title="End session"
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-500 transition-colors"
          >
            <Square size={11} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
