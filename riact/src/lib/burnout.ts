import { differenceInMinutes, parseISO, subDays } from "date-fns";
import type { Break, BurnoutCheck, Goal, Session } from "./types";
import { calculateBreakMinutes } from "./utils";

function avgSessionLength(sessions: Session[]): number {
  const completed = sessions.filter((s) => s.end_time && s.net_study_minutes != null);
  if (completed.length === 0) return 0;
  return completed.reduce((sum, s) => sum + (s.net_study_minutes ?? 0), 0) / completed.length;
}

function avgBreaksPerSession(sessions: Session[], breaks: Break[]): number {
  if (sessions.length === 0) return 0;
  const sessionIds = new Set(sessions.map((s) => s.id));
  const relevantBreaks = breaks.filter((b) => sessionIds.has(b.session_id));
  return relevantBreaks.length / sessions.length;
}

function lateNightSessions(sessions: Session[]): number {
  return sessions.filter((s) => {
    const hour = parseISO(s.start_time).getHours();
    return hour >= 22;
  }).length;
}

function goalCompletionRate(
  goals: Goal[],
  sessions: Session[],
  rangeStart: Date,
  rangeEnd: Date
): number {
  const activeGoals = goals.filter((g) => g.is_active);
  if (activeGoals.length === 0) return 1;

  const inRange = sessions.filter((s) => {
    if (!s.end_time) return false;
    const t = parseISO(s.start_time);
    return t >= rangeStart && t <= rangeEnd;
  });

  let met = 0;
  for (const goal of activeGoals) {
    const targetMinutes = goal.target_hours * 60;
    const relevant = inRange.filter(
      (s) => !goal.location_name || s.location_name === goal.location_name
    );
    const studied = relevant.reduce((sum, s) => sum + (s.net_study_minutes ?? 0), 0);
    if (studied >= targetMinutes) met++;
  }
  return met / activeGoals.length;
}

export function checkBurnout(
  sessions: Session[],
  breaks: Break[],
  goals: Goal[]
): BurnoutCheck {
  const signals: string[] = [];
  const now = new Date();
  const last7Start = subDays(now, 7);
  const prev7Start = subDays(now, 14);

  const last7 = sessions.filter((s) => {
    const t = parseISO(s.start_time);
    return t >= last7Start && s.end_time;
  });

  const prev7 = sessions.filter((s) => {
    const t = parseISO(s.start_time);
    return t >= prev7Start && t < last7Start && s.end_time;
  });

  const avgLast = avgSessionLength(last7);
  const avgPrev = avgSessionLength(prev7);
  if (prev7.length > 0 && avgLast < avgPrev * 0.85) {
    signals.push("Average session length is decreasing week over week");
  }

  const breakFreqLast = avgBreaksPerSession(last7, breaks);
  const breakFreqPrev = avgBreaksPerSession(prev7, breaks);
  if (prev7.length > 0 && breakFreqLast > breakFreqPrev * 1.25) {
    signals.push("Break frequency is increasing");
  }

  if (lateNightSessions(last7) > 2) {
    signals.push("More than 2 sessions after 10pm in the last 7 days");
  }

  const completion = goalCompletionRate(goals, sessions, last7Start, now);
  if (goals.some((g) => g.is_active) && completion < 0.5) {
    signals.push("Goal completion rate below 50%");
  }

  return { triggered: signals.length > 0, signals };
}

export function sessionNetMinutes(session: Session, breaks: Break[]): number {
  if (session.net_study_minutes != null) return session.net_study_minutes;
  if (!session.end_time) return 0;
  const total = differenceInMinutes(parseISO(session.end_time), parseISO(session.start_time));
  return Math.max(0, total - calculateBreakMinutes(breaks));
}
