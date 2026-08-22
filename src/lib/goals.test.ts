import { describe, expect, it } from "vitest";
import { getGoalProgress } from "./goals";
import type { Goal, Session } from "./types";

// getGoalProgress takes `now` as a parameter, so these need no fake timers.
// Wednesday sits mid-week: the Monday-start week runs 15th–21st June 2026.
const WEDNESDAY = new Date(2026, 5, 17, 12, 0, 0);

function at(day: number, hour = 10): string {
  return new Date(2026, 5, day, hour, 0, 0).toISOString();
}

let seq = 0;

function session(overrides: Partial<Session> = {}): Session {
  seq += 1;
  return {
    id: `s${seq}`,
    user_id: "u1",
    location_id: null,
    location_name: "Library",
    start_time: at(17),
    end_time: at(17, 12),
    projected_end_time: null,
    net_study_minutes: 60,
    total_minutes: 60,
    created_at: at(17),
    ...overrides,
  };
}

function goal(overrides: Partial<Goal> = {}): Goal {
  seq += 1;
  return {
    id: `g${seq}`,
    user_id: "u1",
    location_name: null,
    target_hours: 2,
    timeframe: "daily",
    is_active: true,
    created_at: at(1),
    ...overrides,
  };
}

describe("getGoalProgress", () => {
  it("returns nothing when there are no goals", () => {
    expect(getGoalProgress([], [session()], WEDNESDAY)).toEqual([]);
  });

  it("skips inactive goals", () => {
    const goals = [goal({ is_active: false }), goal({ is_active: true })];
    const progress = getGoalProgress(goals, [session()], WEDNESDAY);
    expect(progress).toHaveLength(1);
    expect(progress[0].goal.is_active).toBe(true);
  });

  it("converts target hours into minutes", () => {
    const [p] = getGoalProgress([goal({ target_hours: 2.5 })], [], WEDNESDAY);
    expect(p.targetMinutes).toBe(150);
  });

  describe("daily goals", () => {
    it("counts only sessions from today", () => {
      const sessions = [
        session({ start_time: at(17), end_time: at(17, 12) }),
        session({ start_time: at(16), end_time: at(16, 12) }), // yesterday
      ];
      const [p] = getGoalProgress([goal({ timeframe: "daily" })], sessions, WEDNESDAY);
      expect(p.studiedMinutes).toBe(60);
    });

    it("includes a session from earlier the same day", () => {
      const sessions = [session({ start_time: at(17, 1), end_time: at(17, 2) })];
      const [p] = getGoalProgress([goal({ timeframe: "daily" })], sessions, WEDNESDAY);
      expect(p.studiedMinutes).toBe(60);
    });
  });

  describe("weekly goals", () => {
    const weekly = () => goal({ timeframe: "weekly", target_hours: 10 });

    it("counts every session in the Monday-to-Sunday week", () => {
      const sessions = [
        session({ start_time: at(15), end_time: at(15, 12) }), // Monday
        session({ start_time: at(17), end_time: at(17, 12) }), // Wednesday
        session({ start_time: at(21), end_time: at(21, 12) }), // Sunday
      ];
      const [p] = getGoalProgress([weekly()], sessions, WEDNESDAY);
      expect(p.studiedMinutes).toBe(180);
    });

    it("excludes the Sunday belonging to the previous week", () => {
      // The week starts Monday, so the 14th falls outside it.
      const sessions = [session({ start_time: at(14), end_time: at(14, 12) })];
      const [p] = getGoalProgress([weekly()], sessions, WEDNESDAY);
      expect(p.studiedMinutes).toBe(0);
    });

    it("excludes the following Monday", () => {
      const sessions = [session({ start_time: at(22), end_time: at(22, 12) })];
      const [p] = getGoalProgress([weekly()], sessions, WEDNESDAY);
      expect(p.studiedMinutes).toBe(0);
    });
  });

  it("ignores sessions that are still running", () => {
    const sessions = [session({ end_time: null, net_study_minutes: 999 })];
    const [p] = getGoalProgress([goal()], sessions, WEDNESDAY);
    expect(p.studiedMinutes).toBe(0);
  });

  it("treats a missing net_study_minutes as zero", () => {
    const sessions = [session({ net_study_minutes: null })];
    const [p] = getGoalProgress([goal()], sessions, WEDNESDAY);
    expect(p.studiedMinutes).toBe(0);
  });

  describe("location-scoped goals", () => {
    it("counts only sessions at the goal's location", () => {
      const sessions = [
        session({ location_name: "Library" }),
        session({ location_name: "Cafe" }),
      ];
      const [p] = getGoalProgress(
        [goal({ location_name: "Library" })],
        sessions,
        WEDNESDAY
      );
      expect(p.studiedMinutes).toBe(60);
    });

    it("counts every location when the goal is unscoped", () => {
      const sessions = [
        session({ location_name: "Library" }),
        session({ location_name: "Cafe" }),
      ];
      const [p] = getGoalProgress([goal({ location_name: null })], sessions, WEDNESDAY);
      expect(p.studiedMinutes).toBe(120);
    });
  });

  describe("percentage", () => {
    it("reports partial progress", () => {
      // 60 minutes studied against a 2 hour target.
      const [p] = getGoalProgress([goal({ target_hours: 2 })], [session()], WEDNESDAY);
      expect(p.percent).toBe(50);
    });

    it("clamps at 100 when the target is beaten", () => {
      const sessions = [session({ net_study_minutes: 600 })];
      const [p] = getGoalProgress([goal({ target_hours: 1 })], sessions, WEDNESDAY);
      expect(p.percent).toBe(100);
      // The raw total is still reported, only the bar is clamped.
      expect(p.studiedMinutes).toBe(600);
    });

    it("reports zero rather than dividing by a zero target", () => {
      const [p] = getGoalProgress([goal({ target_hours: 0 })], [session()], WEDNESDAY);
      expect(p.percent).toBe(0);
      expect(Number.isNaN(p.percent)).toBe(false);
    });
  });
});
