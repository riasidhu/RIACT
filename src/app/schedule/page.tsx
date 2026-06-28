"use client";

import { useEffect, useState } from "react";
import { addDays, format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import AppLayout from "@/components/AppLayout";
import { createClient } from "@/lib/supabase";
import type { ScheduleClass } from "@/lib/types";
import { Ban, CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, RotateCcw, X } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const START_HOUR = 8;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const PX_PER_HOUR = 56;

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fmt(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return `${hour}${m === 0 ? "" : `:${String(m).padStart(2, "0")}`}${ampm}`;
}

function isActiveInWeek(cls: ScheduleClass, weekStart: Date, weekEnd: Date): boolean {
  if (!cls.valid_from && !cls.valid_until) return true;
  const from = cls.valid_from ? new Date(cls.valid_from + "T00:00:00") : null;
  const until = cls.valid_until ? new Date(cls.valid_until + "T00:00:00") : null;
  if (from && from > weekEnd) return false;
  if (until && until < weekStart) return false;
  return true;
}

// Get the calendar date of a class occurrence in a given week
function getOccurrenceDate(dayOfWeek: string, weekStart: Date): string {
  const idx = DAYS.indexOf(dayOfWeek);
  return format(addDays(weekStart, idx), "yyyy-MM-dd");
}

interface ClassBlockProps {
  cls: ScheduleClass;
  cancelled: boolean;
  onCancel: () => void;
  onRestore: () => void;
  onDelete: (id: string) => void;
}

function ClassBlock({ cls, cancelled, onCancel, onRestore, onDelete }: ClassBlockProps) {
  const startMin = timeToMinutes(cls.start_time) - START_HOUR * 60;
  const endMin = timeToMinutes(cls.end_time) - START_HOUR * 60;
  const top = (startMin / 60) * PX_PER_HOUR;
  const height = Math.max(((endMin - startMin) / 60) * PX_PER_HOUR, 24);

  if (cancelled) {
    return (
      <div className="absolute inset-x-0.5 rounded-lg overflow-hidden group" style={{ top, height }}>
        <div className="absolute inset-0 bg-slate-100 border border-slate-200 border-dashed rounded-lg" />
        <div className="relative h-full flex flex-col justify-between p-1.5">
          <div className="min-h-0">
            <p className="text-[10px] font-medium text-slate-300 leading-tight truncate line-through">{cls.course_name}</p>
            {height > 36 && <p className="text-[9px] text-slate-300 leading-tight mt-0.5">Cancelled</p>}
          </div>
          <button
            onClick={onRestore}
            className="self-end opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 px-1 py-0.5 rounded bg-white border border-slate-200 text-slate-400 hover:text-green-600 hover:border-green-300 text-[9px]"
          >
            <RotateCcw size={8} /> restore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-x-0.5 rounded-lg overflow-hidden group" style={{ top, height }}>
      <div className="absolute inset-0 bg-pink-400/30 backdrop-blur-[2px] border border-pink-300/60 rounded-lg" />
      <div
        className="absolute inset-0 rounded-lg opacity-20"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #ec4899 0px, #ec4899 1px, transparent 1px, transparent 8px)" }}
      />
      <div className="relative h-full flex flex-col justify-between p-1.5">
        <div className="min-h-0">
          <p className="text-[10px] font-bold text-pink-800 leading-tight truncate">{cls.course_name}</p>
          {height > 36 && <p className="text-[9px] text-pink-600 leading-tight mt-0.5">{fmt(cls.start_time)}–{fmt(cls.end_time)}</p>}
          {height > 52 && cls.location && <p className="text-[9px] text-pink-500 leading-tight truncate">{cls.location}</p>}
        </div>
        {/* Hover actions */}
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onCancel}
            title="Cancel this week"
            className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-white/70 text-slate-500 hover:bg-amber-50 hover:text-amber-600 text-[9px]"
          >
            <Ban size={8} /> skip
          </button>
          <button
            onClick={() => onDelete(cls.id)}
            title="Delete class permanently"
            className="p-0.5 rounded bg-white/70 hover:bg-red-100 text-slate-400 hover:text-red-500"
          >
            <X size={9} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const supabase = createClient();
  const [classes, setClasses] = useState<ScheduleClass[]>([]);
  const [exceptions, setExceptions] = useState<{ id: string; schedule_id: string; exception_date: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Form state
  const [courseName, setCourseName] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<ScheduleClass>>({});

  async function loadData() {
    const [{ data: cls }, { data: exc }] = await Promise.all([
      supabase.from("schedule").select("*").order("day_of_week").order("start_time"),
      supabase.from("schedule_exceptions").select("*"),
    ]);
    setClasses(cls ?? []);
    setExceptions(exc ?? []);
  }

  useEffect(() => {
    loadData();
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
      valid_from: validFrom || null,
      valid_until: validUntil || null,
    });
    setCourseName(""); setLocation(""); setValidFrom(""); setValidUntil("");
    setShowForm(false); setLoading(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Permanently remove this class from your schedule?")) return;
    await supabase.from("schedule").delete().eq("id", id);
    loadData();
  }

  async function handleCancelOccurrence(cls: ScheduleClass) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const date = getOccurrenceDate(cls.day_of_week, weekStart);
    await supabase.from("schedule_exceptions").insert({ schedule_id: cls.id, exception_date: date });
    loadData();
  }

  async function handleRestoreOccurrence(cls: ScheduleClass) {
    const date = getOccurrenceDate(cls.day_of_week, weekStart);
    const exc = exceptions.find((e) => e.schedule_id === cls.id && e.exception_date === date);
    if (exc) await supabase.from("schedule_exceptions").delete().eq("id", exc.id);
    loadData();
  }

  function startEdit(cls: ScheduleClass) {
    setEditId(cls.id);
    setEditFields({
      course_name: cls.course_name,
      day_of_week: cls.day_of_week,
      start_time: cls.start_time,
      end_time: cls.end_time,
      location: cls.location ?? "",
      valid_from: cls.valid_from ?? "",
      valid_until: cls.valid_until ?? "",
    });
  }

  async function handleSaveEdit(id: string) {
    await supabase.from("schedule").update({
      course_name: editFields.course_name,
      day_of_week: editFields.day_of_week,
      start_time: editFields.start_time,
      end_time: editFields.end_time,
      location: (editFields.location as string)?.trim() || null,
      valid_from: (editFields.valid_from as string) || null,
      valid_until: (editFields.valid_until as string) || null,
    }).eq("id", id);
    setEditId(null);
    loadData();
  }

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const activeClasses = classes.filter((c) => isActiveInWeek(c, weekStart, weekEnd));
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  function isCancelled(cls: ScheduleClass) {
    const date = getOccurrenceDate(cls.day_of_week, weekStart);
    return exceptions.some((e) => e.schedule_id === cls.id && e.exception_date === date);
  }

  const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300 transition-colors";

  return (
    <AppLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Class Schedule</h1>
            <p className="mt-1 text-slate-500 text-sm">Shaded = class time · Dashed = cancelled this week · White = study window</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-pink-500 transition-all"
          >
            <Plus size={14} />Add class
          </button>
        </div>

        {/* Add class form */}
        {showForm && (
          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">New Class</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Course name</span>
                <input type="text" required value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g. CMPT 120" className={inputClass} autoFocus />
              </label>
              <div className="grid grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Day</span>
                  <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className={inputClass}>
                    {DAYS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Start</span>
                  <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">End</span>
                  <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location (optional)</span>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. AQ 3150" className={inputClass} />
              </label>
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active dates (optional)</span>
                <p className="text-xs text-slate-400 mb-2 mt-0.5">Leave blank to always show. Set a range for a specific semester.</p>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs text-slate-400">From</span>
                    <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-400">Until</span>
                    <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputClass} />
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-pink-500 disabled:opacity-50 transition-all">
                  <Plus size={14} />{loading ? "Saving..." : "Add Class"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Week navigator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <button onClick={() => setWeekStart((w) => subWeeks(w, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <ChevronLeft size={14} className="text-slate-500" />
            </button>
            <div className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white">
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </div>
            <button onClick={() => setWeekStart((w) => addWeeks(w, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <ChevronRight size={14} className="text-slate-500" />
            </button>
            <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="ml-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">
              Today
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-pink-300/50 border border-pink-300" /><span className="text-xs text-slate-400">Class</span></div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-slate-100 border border-slate-200 border-dashed" /><span className="text-xs text-slate-400">Cancelled</span></div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-white border border-slate-200" /><span className="text-xs text-slate-400">Free</span></div>
          </div>
        </div>

        {/* Timetable */}
        <div className="rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          {classes.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays size={28} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 mb-1">No classes added yet</p>
              <p className="text-xs text-slate-400">Click "Add class" to fill in your timetable.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ minWidth: 600 }}>
                <div className="flex border-b border-slate-100">
                  <div className="w-12 shrink-0" />
                  {DAYS.map((day, i) => (
                    <div key={day} className="flex-1 py-3 text-center border-l border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{DAY_SHORT[i]}</span>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <div className="w-12 shrink-0 relative" style={{ height: TOTAL_HOURS * PX_PER_HOUR }}>
                    {hours.map((h) => (
                      <div key={h} className="absolute right-2 text-[10px] text-slate-300 font-medium" style={{ top: (h - START_HOUR) * PX_PER_HOUR - 6 }}>
                        {h % 12 || 12}{h < 12 ? "a" : "p"}
                      </div>
                    ))}
                  </div>
                  {DAYS.map((day) => {
                    const dayClasses = activeClasses.filter((c) => c.day_of_week === day);
                    return (
                      <div key={day} className="flex-1 relative border-l border-slate-100" style={{ height: TOTAL_HOURS * PX_PER_HOUR }}>
                        {hours.map((h) => (
                          <div key={h} className="absolute inset-x-0 border-t border-slate-50" style={{ top: (h - START_HOUR) * PX_PER_HOUR }} />
                        ))}
                        {dayClasses.map((cls) => (
                          <ClassBlock
                            key={cls.id}
                            cls={cls}
                            cancelled={isCancelled(cls)}
                            onCancel={() => handleCancelOccurrence(cls)}
                            onRestore={() => handleRestoreOccurrence(cls)}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {classes.length > 0 && activeClasses.length === 0 && (
          <p className="mt-4 text-center text-sm text-slate-400">No classes active this week — navigate to a different week or check your date ranges.</p>
        )}

        {classes.length > 0 && (
          <p className="mt-3 text-xs text-slate-400 text-center">
            Hover a block · <span className="font-medium">Skip</span> cancels just that week · <span className="font-medium">✕</span> removes the class permanently
          </p>
        )}

        {/* Manage all classes */}
        {classes.length > 0 && (
          <div className="mt-8 rounded-xl bg-white border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">All Classes</h2>
            <ul className="space-y-2">
              {classes.map((cls) => (
                <li key={cls.id}>
                  {editId === cls.id ? (
                    <div className="rounded-xl border border-pink-200 bg-pink-50/40 p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block col-span-2">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Course name</span>
                          <input type="text" value={editFields.course_name ?? ""} onChange={(e) => setEditFields((f) => ({ ...f, course_name: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-pink-400 focus:outline-none" />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Day</span>
                          <select value={editFields.day_of_week ?? "Monday"} onChange={(e) => setEditFields((f) => ({ ...f, day_of_week: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-pink-400 focus:outline-none">
                            {DAYS.map((d) => <option key={d}>{d}</option>)}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location</span>
                          <input type="text" value={editFields.location ?? ""} onChange={(e) => setEditFields((f) => ({ ...f, location: e.target.value }))} placeholder="Optional" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-pink-400 focus:outline-none" />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Start time</span>
                          <input type="time" value={editFields.start_time ?? ""} onChange={(e) => setEditFields((f) => ({ ...f, start_time: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-pink-400 focus:outline-none" />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">End time</span>
                          <input type="time" value={editFields.end_time ?? ""} onChange={(e) => setEditFields((f) => ({ ...f, end_time: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-pink-400 focus:outline-none" />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active from</span>
                          <input type="date" value={editFields.valid_from ?? ""} onChange={(e) => setEditFields((f) => ({ ...f, valid_from: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-pink-400 focus:outline-none" />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active until</span>
                          <input type="date" value={editFields.valid_until ?? ""} onChange={(e) => setEditFields((f) => ({ ...f, valid_until: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-pink-400 focus:outline-none" />
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEdit(cls.id)} className="rounded-lg bg-pink-500 px-4 py-2 text-xs font-semibold text-white hover:bg-pink-400 transition-colors">Save</button>
                        <button onClick={() => setEditId(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{cls.course_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {cls.day_of_week} · {fmt(cls.start_time)}–{fmt(cls.end_time)}
                          {cls.location ? ` · ${cls.location}` : ""}
                          {cls.valid_from || cls.valid_until ? ` · ${cls.valid_from ?? "—"} to ${cls.valid_until ?? "—"}` : " · Always active"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <button onClick={() => startEdit(cls)} className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-300 hover:bg-pink-50 hover:text-pink-500 transition-colors" title="Edit">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => handleDelete(cls.id)} className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors" title="Delete permanently">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
