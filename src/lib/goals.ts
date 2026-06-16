import { parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import type { Goal, Session } from "./types";

export interface GoalProgress {
  goal: Goal;
  studiedMinutes: number;
  targetMinutes: number;
  percent: number;
}

export function getGoalProgress(goals: Goal[], sessions: Session[], now = new Date()): GoalProgress[] {
  return goals
    .filter((g) => g.is_active)
    .map((goal) => {
      const range =
        goal.timeframe === "daily"
          ? { start: startOfDay(now), end: endOfDay(now) }
          : { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };

      const relevant = sessions.filter((s) => {
        if (!s.end_time) return false;
        const t = parseISO(s.start_time);
        if (t < range.start || t > range.end) return false;
        if (goal.location_name && s.location_name !== goal.location_name) return false;
        return true;
      });

      const studiedMinutes = relevant.reduce((sum, s) => sum + (s.net_study_minutes ?? 0), 0);
      const targetMinutes = goal.target_hours * 60;
      const percent = targetMinutes > 0 ? Math.min(100, (studiedMinutes / targetMinutes) * 100) : 0;

      return { goal, studiedMinutes, targetMinutes, percent };
    });
}
