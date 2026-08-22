import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkBurnout, sessionNetMinutes } from "./burnout";
import type { Break, Goal, Session } from "./types";

// checkBurnout() reads the clock internally, so every test runs against a
// pinned "now". Mid-June avoids DST transitions in the common timezones.
const NOW = new Date(2026, 5, 15, 12, 0, 0);

/**
 * Build an ISO timestamp N days before NOW at a given *local* hour.
 * lateNightSessions() compares against getHours(), which is local, so
 * constructing these with local setters keeps the suite timezone-independent.
 */
function isoAt(daysAgo: number, hour: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

let seq = 0;

function session(overrides: Partial<Session> = {}): Session {
  seq += 1;
  return {
    id: `s${seq}`,
    user_id: "u1",
    location_id: null,
    location_name: "Library",
    start_time: isoAt(2, 10),
    end_time: isoAt(2, 12),
    projected_end_time: null,
    net_study_minutes: 120,
    total_minutes: 120,
    created_at: isoAt(2, 10),
    ...overrides,
  };
}

function brk(sessionId: string, overrides: Partial<Break> = {}): Break {
  seq += 1;
  return {
    id: `b${seq}`,
    session_id: sessionId,
    start_time: isoAt(2, 11),
    end_time: isoAt(2, 11),
    duration_minutes: 10,
    ...overrides,
  };
}

function goal(overrides: Partial<Goal> = {}): Goal {
  seq += 1;
  return {
    id: `g${seq}`,
    user_id: "u1",
    location_name: null,
    target_hours: 1,
    timeframe: "weekly",
    is_active: true,
    created_at: isoAt(30, 12),
    ...overrides,
  };
}

/** Did any signal mention this topic? Keeps assertions off exact wording. */
function hasSignal(signals: string[], pattern: RegExp): boolean {
  return signals.some((s) => pattern.test(s));
}

const SHORTER = /session length/i;
const BREAKS = /break frequency/i;
const LATE = /after 10pm/i;
const GOALS = /goal completion/i;

beforeEach(() => {
  seq = 0;
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("checkBurnout", () => {
  it("reports no signals when there is no data at all", () => {
    const result = checkBurnout([], [], []);
    expect(result).toEqual({ triggered: false, signals: [] });
  });

  it("does not trigger on a healthy, steady week", () => {
    const sessions = [
      session({ start_time: isoAt(9, 10), end_time: isoAt(9, 12) }),
      session({ start_time: isoAt(10, 10), end_time: isoAt(10, 12) }),
      session({ start_time: isoAt(2, 10), end_time: isoAt(2, 12) }),
      session({ start_time: isoAt(3, 10), end_time: isoAt(3, 12) }),
    ];
    const result = checkBurnout(sessions, [], []);
    expect(result.triggered).toBe(false);
    expect(result.signals).toEqual([]);
  });

  describe("declining session length", () => {
    // Rule: avg(last 7d) < avg(prev 7d) * 0.85
    function weeks(prevMinutes: number, lastMinutes: number): Session[] {
      return [
        session({ start_time: isoAt(9, 10), net_study_minutes: prevMinutes }),
        session({ start_time: isoAt(10, 10), net_study_minutes: prevMinutes }),
        session({ start_time: isoAt(2, 10), net_study_minutes: lastMinutes }),
        session({ start_time: isoAt(3, 10), net_study_minutes: lastMinutes }),
      ];
    }

    it("flags a drop past the 85% threshold", () => {
      const { signals } = checkBurnout(weeks(120, 60), [], []);
      expect(hasSignal(signals, SHORTER)).toBe(true);
    });

    it("ignores a mild dip that stays within the threshold", () => {
      // 110 is ~92% of 120, above the 0.85 cutoff.
      const { signals } = checkBurnout(weeks(120, 110), [], []);
      expect(hasSignal(signals, SHORTER)).toBe(false);
    });

    it("treats the threshold itself as acceptable", () => {
      // Exactly 85% — the comparison is strict, so this must not fire.
      const { signals } = checkBurnout(weeks(120, 102), [], []);
      expect(hasSignal(signals, SHORTER)).toBe(false);
    });

    it("stays silent without a prior week to compare against", () => {
      const sessions = [
        session({ start_time: isoAt(2, 10), net_study_minutes: 5 }),
        session({ start_time: isoAt(3, 10), net_study_minutes: 5 }),
      ];
      const { signals } = checkBurnout(sessions, [], []);
      expect(hasSignal(signals, SHORTER)).toBe(false);
    });
  });

  describe("rising break frequency", () => {
    // Rule: breaks-per-session(last 7d) > breaks-per-session(prev 7d) * 1.25
    it("flags more frequent breaks at equal session length", () => {
      const prevA = session({ start_time: isoAt(9, 10) });
      const prevB = session({ start_time: isoAt(10, 10) });
      const lastA = session({ start_time: isoAt(2, 10) });
      const lastB = session({ start_time: isoAt(3, 10) });

      // Previous week: 2 breaks over 2 sessions (1.0).
      // This week: 3 breaks over 2 sessions (1.5), past the 1.25 multiplier.
      const breaks = [
        brk(prevA.id),
        brk(prevB.id),
        brk(lastA.id),
        brk(lastA.id),
        brk(lastB.id),
      ];

      const { signals } = checkBurnout([prevA, prevB, lastA, lastB], breaks, []);
      expect(hasSignal(signals, BREAKS)).toBe(true);
    });

    it("ignores an unchanged break rate", () => {
      const prevA = session({ start_time: isoAt(9, 10) });
      const prevB = session({ start_time: isoAt(10, 10) });
      const lastA = session({ start_time: isoAt(2, 10) });
      const lastB = session({ start_time: isoAt(3, 10) });
      const breaks = [brk(prevA.id), brk(prevB.id), brk(lastA.id), brk(lastB.id)];

      const { signals } = checkBurnout([prevA, prevB, lastA, lastB], breaks, []);
      expect(hasSignal(signals, BREAKS)).toBe(false);
    });
  });

  describe("late-night clustering", () => {
    // Rule: more than 2 sessions starting at or after 22:00 in the last 7 days
    function lateSessions(count: number): Session[] {
      return Array.from({ length: count }, (_, i) =>
        session({ start_time: isoAt(i + 1, 22), end_time: isoAt(i + 1, 23) })
      );
    }

    it("flags three late sessions", () => {
      const { signals } = checkBurnout(lateSessions(3), [], []);
      expect(hasSignal(signals, LATE)).toBe(true);
    });

    it("allows two late sessions", () => {
      const { signals } = checkBurnout(lateSessions(2), [], []);
      expect(hasSignal(signals, LATE)).toBe(false);
    });

    it("does not count an evening session before 10pm", () => {
      const sessions = Array.from({ length: 3 }, (_, i) =>
        session({ start_time: isoAt(i + 1, 21), end_time: isoAt(i + 1, 23) })
      );
      const { signals } = checkBurnout(sessions, [], []);
      expect(hasSignal(signals, LATE)).toBe(false);
    });

    describe("when the user has saved a timezone", () => {
      // Each instant is 22:00 in Tokyo (UTC+9) but 14:00 in London (BST).
      // Same absolute moments — only the zone changes the verdict.
      function fixedInstants(): Session[] {
        return [
          "2026-06-14T13:00:00.000Z",
          "2026-06-13T13:00:00.000Z",
          "2026-06-12T13:00:00.000Z",
        ].map((iso) => session({ start_time: iso, end_time: iso }));
      }

      it("counts sessions that are late night in that zone", () => {
        const { signals } = checkBurnout(fixedInstants(), [], [], "Asia/Tokyo");
        expect(hasSignal(signals, LATE)).toBe(true);
      });

      it("does not count the same instants where they fall in the afternoon", () => {
        const { signals } = checkBurnout(fixedInstants(), [], [], "Europe/London");
        expect(hasSignal(signals, LATE)).toBe(false);
      });

      it("falls back to the runtime zone when no timezone is given", () => {
        // Built with local setters, so this is 10pm wherever the test runs.
        const local = Array.from({ length: 3 }, (_, i) =>
          session({ start_time: isoAt(i + 1, 22), end_time: isoAt(i + 1, 23) })
        );
        expect(hasSignal(checkBurnout(local, [], []).signals, LATE)).toBe(true);
      });
    });

    it("does not count late sessions from the week before", () => {
      const sessions = Array.from({ length: 3 }, (_, i) =>
        session({ start_time: isoAt(i + 9, 22), end_time: isoAt(i + 9, 23) })
      );
      const { signals } = checkBurnout(sessions, [], []);
      expect(hasSignal(signals, LATE)).toBe(false);
    });
  });

  describe("goal completion", () => {
    // Rule: active goals exist and fewer than half were met this week
    it("flags a goal that was badly missed", () => {
      const sessions = [session({ start_time: isoAt(2, 10), net_study_minutes: 60 })];
      const { signals } = checkBurnout(sessions, [], [goal({ target_hours: 10 })]);
      expect(hasSignal(signals, GOALS)).toBe(true);
    });

    it("stays silent when the goal was met", () => {
      const sessions = [session({ start_time: isoAt(2, 10), net_study_minutes: 120 })];
      const { signals } = checkBurnout(sessions, [], [goal({ target_hours: 1 })]);
      expect(hasSignal(signals, GOALS)).toBe(false);
    });

    it("ignores inactive goals entirely", () => {
      const { signals } = checkBurnout([], [], [goal({ target_hours: 40, is_active: false })]);
      expect(hasSignal(signals, GOALS)).toBe(false);
    });

    it("counts only sessions at a location-scoped goal's location", () => {
      const sessions = [
        session({ start_time: isoAt(2, 10), location_name: "Cafe", net_study_minutes: 600 }),
      ];
      const scoped = goal({ target_hours: 5, location_name: "Library" });
      const { signals } = checkBurnout(sessions, [], [scoped]);
      expect(hasSignal(signals, GOALS)).toBe(true);
    });

    it("flags a completion rate that falls between zero and half", () => {
      // 1 of 3 met = 0.33. Pins the cutoff from below: a rate this side of
      // 0.5 must still fire, not just a total miss.
      const sessions = [session({ start_time: isoAt(2, 10), net_study_minutes: 120 })];
      const goals = [
        goal({ target_hours: 1 }),
        goal({ target_hours: 50 }),
        goal({ target_hours: 60 }),
      ];
      const { signals } = checkBurnout(sessions, [], goals);
      expect(hasSignal(signals, GOALS)).toBe(true);
    });

    it("treats half the goals met as acceptable", () => {
      // 1 of 2 met = 0.5, and the comparison is strict.
      const sessions = [session({ start_time: isoAt(2, 10), net_study_minutes: 120 })];
      const goals = [goal({ target_hours: 1 }), goal({ target_hours: 50 })];
      const { signals } = checkBurnout(sessions, [], goals);
      expect(hasSignal(signals, GOALS)).toBe(false);
    });
  });

  it("ignores sessions that are still running", () => {
    const sessions = [
      session({ start_time: isoAt(9, 10), net_study_minutes: 120 }),
      session({ start_time: isoAt(10, 10), net_study_minutes: 120 }),
      // An active session with no end_time must not drag the average down.
      session({ start_time: isoAt(2, 10), end_time: null, net_study_minutes: 1 }),
      session({ start_time: isoAt(3, 10), net_study_minutes: 120 }),
    ];
    const { signals } = checkBurnout(sessions, [], []);
    expect(hasSignal(signals, SHORTER)).toBe(false);
  });

  it("accumulates every signal it finds", () => {
    const sessions = [
      // Previous week: long sessions, no breaks.
      session({ start_time: isoAt(9, 10), net_study_minutes: 200 }),
      session({ start_time: isoAt(10, 10), net_study_minutes: 200 }),
      // This week: short, late-night sessions.
      session({ start_time: isoAt(1, 22), net_study_minutes: 20 }),
      session({ start_time: isoAt(2, 22), net_study_minutes: 20 }),
      session({ start_time: isoAt(3, 22), net_study_minutes: 20 }),
    ];
    const result = checkBurnout(sessions, [], [goal({ target_hours: 20 })]);

    expect(result.triggered).toBe(true);
    expect(hasSignal(result.signals, SHORTER)).toBe(true);
    expect(hasSignal(result.signals, LATE)).toBe(true);
    expect(hasSignal(result.signals, GOALS)).toBe(true);
  });

  it("is deterministic — the same input always yields the same output", () => {
    const sessions = [
      session({ start_time: isoAt(9, 10), net_study_minutes: 200 }),
      session({ start_time: isoAt(2, 22), net_study_minutes: 20 }),
    ];
    const first = checkBurnout(sessions, [], []);
    const second = checkBurnout(sessions, [], []);
    expect(second).toEqual(first);
  });
});

describe("sessionNetMinutes", () => {
  it("uses the stored value when one exists", () => {
    const s = session({ net_study_minutes: 97 });
    expect(sessionNetMinutes(s, [])).toBe(97);
  });

  it("treats a stored zero as a real value, not a missing one", () => {
    const s = session({ net_study_minutes: 0 });
    expect(sessionNetMinutes(s, [])).toBe(0);
  });

  it("returns 0 for a running session with nothing stored", () => {
    const s = session({ net_study_minutes: null, end_time: null });
    expect(sessionNetMinutes(s, [])).toBe(0);
  });

  it("derives from the timestamps when nothing is stored", () => {
    const s = session({
      net_study_minutes: null,
      start_time: isoAt(2, 10),
      end_time: isoAt(2, 12),
    });
    expect(sessionNetMinutes(s, [])).toBe(120);
  });

  it("subtracts break time from the derived total", () => {
    const s = session({
      net_study_minutes: null,
      start_time: isoAt(2, 10),
      end_time: isoAt(2, 12),
    });
    const breaks = [brk(s.id, { duration_minutes: 30 })];
    expect(sessionNetMinutes(s, breaks)).toBe(90);
  });

  it("never returns a negative total", () => {
    const s = session({
      net_study_minutes: null,
      start_time: isoAt(2, 10),
      end_time: isoAt(2, 11),
    });
    const breaks = [brk(s.id, { duration_minutes: 500 })];
    expect(sessionNetMinutes(s, breaks)).toBe(0);
  });
});
