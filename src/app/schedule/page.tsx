"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { createClient } from "@/lib/supabase";
import type { ScheduleClass } from "@/lib/types";
import { CalendarDays, Clock, MapPin, Plus, Trash2 } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function fmt(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function SchedulePage() {
  const supabase = createClient();
  const [classes, setClasses] = useState<ScheduleClass[]>([]);
  const [courseName, setCourseName] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadClasses() {
    const { data } = await supabase
      .from("schedule")
      .select("*")
      .order("day_of_week")
      .order("start_time");
    setClasses(data ?? []);
  }

  useEffect(() => {
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    await supabase.from("schedule").insert({
      user_id: user.id,
      course_name: courseName.trim(),
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      location: location.trim() || null,
    });

    setCourseName("");
    setLocation("");
    setLoading(false);
    loadClasses();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this class from your schedule?")) return;
    await supabase.from("schedule").delete().eq("id", id);
    loadClasses();
  }

  // Group by day in order
  const byDay = DAYS.reduce<Record<string, ScheduleClass[]>>((acc, day) => {
    acc[day] = classes.filter((c) => c.day_of_week === day);
    return acc;
  }, {});

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300 transition-colors";

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Class Schedule</h1>
          <p className="mt-1 text-slate-500 text-sm">
            Add your classes so the AI can plan study sessions around your timetable
          </p>
        </div>

        {/* Add class form */}
        <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50">
              <Plus size={15} className="text-pink-500" />
            </div>
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Add a Class</h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Course name</span>
              <input
                type="text"
                required
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. CMPT 120, Introduction to Psychology"
                className={inputClass}
              />
            </label>

            <div className="grid grid-cols-3 gap-4">
              <label className="block">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Day</span>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className={inputClass}
                >
                  {DAYS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Start time</span>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">End time</span>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location (optional)</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. AQ 3150, Online"
                className={inputClass}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-pink-500 disabled:opacity-50 transition-all"
            >
              <Plus size={14} />
              {loading ? "Saving..." : "Add Class"}
            </button>
          </form>
        </div>

        {/* Weekly timetable */}
        {classes.length === 0 ? (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-8 text-center">
            <CalendarDays size={24} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-1">No classes added yet</p>
            <p className="text-xs text-slate-400">Add your timetable above so the AI can schedule around your classes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {DAYS.map((day) => {
              const dayClasses = byDay[day];
              if (dayClasses.length === 0) return null;
              return (
                <div key={day} className="rounded-xl bg-white border border-slate-100 shadow-sm p-5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{day}</h3>
                  <ul className="space-y-2">
                    {dayClasses.map((cls) => (
                      <li
                        key={cls.id}
                        className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-50">
                            <CalendarDays size={12} className="text-pink-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{cls.course_name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock size={10} />
                                {fmt(cls.start_time)} – {fmt(cls.end_time)}
                              </span>
                              {cls.location && (
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                  <MapPin size={10} />
                                  {cls.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(cls.id)}
                          className="ml-3 flex items-center justify-center h-7 w-7 shrink-0 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
