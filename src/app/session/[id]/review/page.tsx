"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { createClient } from "@/lib/supabase";
import { formatMinutes, toDatetimeLocal } from "@/lib/utils";
import type { Break, Session } from "@/lib/types";
import { differenceInMinutes, parseISO } from "date-fns";
import { CheckCircle, Clock, Coffee, MapPin, Save } from "lucide-react";

export default function ReviewSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState<Session | null>(null);
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);

      const { data: sess } = await supabase.from("sessions").select("*").eq("id", id).single();
      const { data: brks } = await supabase
        .from("breaks")
        .select("*")
        .eq("session_id", id)
        .order("start_time");

      if (sess) {
        if (!sess.end_time) {
          sess.end_time = new Date().toISOString();
        }
        setSession(sess);
      }
      setBreaks(brks ?? []);
    }
    load();
  }, [id, supabase]);

  function recalcMinutes(sess: Session, brks: Break[]) {
    if (!sess.end_time) return { net: 0, total: 0 };
    const total = differenceInMinutes(parseISO(sess.end_time), parseISO(sess.start_time));
    const breakMins = brks.reduce((sum, b) => {
      if (b.duration_minutes != null) return sum + b.duration_minutes;
      if (b.end_time) {
        return sum + differenceInMinutes(parseISO(b.end_time), parseISO(b.start_time));
      }
      return sum;
    }, 0);
    return { net: Math.max(0, total - breakMins), total };
  }

  async function handleSave() {
    if (!session) return;
    setLoading(true);

    const { net, total } = recalcMinutes(session, breaks);

    const { error } = await supabase
      .from("sessions")
      .update({
        location_name: session.location_name,
        start_time: session.start_time,
        end_time: session.end_time,
        projected_end_time: session.projected_end_time,
        net_study_minutes: net,
        total_minutes: total,
      })
      .eq("id", session.id);

    for (const b of breaks) {
      const duration = b.end_time
        ? differenceInMinutes(parseISO(b.end_time), parseISO(b.start_time))
        : null;
      await supabase
        .from("breaks")
        .update({
          start_time: b.start_time,
          end_time: b.end_time,
          duration_minutes: duration,
        })
        .eq("id", b.id);
    }

    setLoading(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => router.push("/"), 1500);
    }
  }

  if (!session) {
    return (
      <AppLayout userEmail={userEmail}>
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </AppLayout>
    );
  }

  const { net, total } = recalcMinutes(session, breaks);
  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300 transition-colors";

  return (
    <AppLayout userEmail={userEmail}>
      <div className="max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Session Summary</h1>
          <p className="mt-1 text-slate-500 text-sm">Review and edit your session before saving</p>
        </div>

        {/* Saved banner */}
        {saved && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            <CheckCircle size={15} className="text-green-500" />
            Session saved! Redirecting home…
          </div>
        )}

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 p-5 text-center shadow-lg shadow-pink-200">
            <p className="text-xs font-semibold text-pink-200 uppercase tracking-wide mb-1">Net Study Time</p>
            <p className="text-3xl font-bold text-white">{formatMinutes(net)}</p>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-5 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Time</p>
            <p className="text-3xl font-bold text-slate-800">{formatMinutes(total)}</p>
          </div>
        </div>

        {/* Edit form */}
        <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6 space-y-5">
          {/* Location */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin size={13} className="text-pink-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</span>
            </div>
            <input
              type="text"
              value={session.location_name}
              onChange={(e) => setSession({ ...session, location_name: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Start / end time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={13} className="text-pink-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Start time</span>
              </div>
              <input
                type="datetime-local"
                value={toDatetimeLocal(parseISO(session.start_time))}
                onChange={(e) =>
                  setSession({ ...session, start_time: new Date(e.target.value).toISOString() })
                }
                className={inputClass}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={13} className="text-slate-300" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">End time</span>
              </div>
              <input
                type="datetime-local"
                value={session.end_time ? toDatetimeLocal(parseISO(session.end_time)) : ""}
                onChange={(e) =>
                  setSession({ ...session, end_time: new Date(e.target.value).toISOString() })
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* Breaks */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Coffee size={13} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Breaks ({breaks.length})
              </span>
            </div>
            {breaks.length === 0 ? (
              <p className="text-sm text-slate-400 bg-slate-50 rounded-lg px-4 py-3">No breaks recorded</p>
            ) : (
              <ul className="space-y-2">
                {breaks.map((b, i) => (
                  <li key={b.id} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Break {i + 1}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-slate-400 mb-1">Start</p>
                        <input
                          type="datetime-local"
                          value={toDatetimeLocal(parseISO(b.start_time))}
                          onChange={(e) => {
                            const updated = [...breaks];
                            updated[i] = { ...b, start_time: new Date(e.target.value).toISOString() };
                            setBreaks(updated);
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-pink-400 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 mb-1">End</p>
                        <input
                          type="datetime-local"
                          value={b.end_time ? toDatetimeLocal(parseISO(b.end_time)) : ""}
                          onChange={(e) => {
                            const updated = [...breaks];
                            updated[i] = { ...b, end_time: new Date(e.target.value).toISOString() };
                            setBreaks(updated);
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-pink-400 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={loading || saved}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-pink-500 disabled:opacity-50 transition-all duration-150"
          >
            <Save size={14} />
            {loading ? "Saving…" : "Save Session"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
