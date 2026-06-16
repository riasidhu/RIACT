import { differenceInMinutes, format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import type { Break, Session } from "./types";

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy h:mm a");
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), "h:mm a");
}

export function toDatetimeLocal(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function calculateBreakMinutes(breaks: Break[]): number {
  return breaks.reduce((sum, b) => {
    if (b.duration_minutes != null) return sum + b.duration_minutes;
    if (b.end_time) {
      return sum + differenceInMinutes(parseISO(b.end_time), parseISO(b.start_time));
    }
    return sum;
  }, 0);
}

export function calculateSessionMinutes(
  session: Session,
  breaks: Break[],
  now: Date = new Date()
): { net: number; total: number } {
  const end = session.end_time ? parseISO(session.end_time) : now;
  const start = parseISO(session.start_time);
  const total = Math.max(0, differenceInMinutes(end, start));
  const breakMins = calculateBreakMinutes(breaks);
  const activeBreak = breaks.find((b) => !b.end_time);
  let activeBreakMins = 0;
  if (activeBreak) {
    activeBreakMins = differenceInMinutes(now, parseISO(activeBreak.start_time));
  }
  const net = Math.max(0, total - breakMins - activeBreakMins);
  return { net, total };
}

export function isToday(iso: string): boolean {
  const d = parseISO(iso);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export function sessionsInRange(sessions: Session[], start: Date, end: Date): Session[] {
  return sessions.filter((s) => {
    const t = parseISO(s.start_time);
    return isWithinInterval(t, { start, end }) && s.end_time;
  });
}

export function getDayRange(date: Date) {
  return { start: startOfDay(date), end: endOfDay(date) };
}

export function getWeekRange(date: Date) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export const CHART_COLORS = ["#EC4899", "#F472B6", "#A855F7", "#6366F1", "#38BDF8", "#34D399"];
