import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AI_HISTORY_DAYS, MIN_SESSIONS_FOR_AI, countSessionsForAI } from "./utils";

const NOW = new Date(2026, 5, 15, 12, 0, 0);

function daysAgo(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function s(startDaysAgo: number, finished = true) {
  return {
    start_time: daysAgo(startDaysAgo),
    end_time: finished ? daysAgo(startDaysAgo) : null,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("countSessionsForAI", () => {
  // This function exists so the home page indicator and the /api/analyze gate
  // read the same set. If they drift, the app promises analysis it then refuses.
  it("counts completed sessions inside the window", () => {
    expect(countSessionsForAI([s(1), s(5), s(20)])).toBe(3);
  });

  it("ignores sessions that are still running", () => {
    expect(countSessionsForAI([s(1), s(2, false), s(3, false)])).toBe(1);
  });

  it("ignores sessions older than the window", () => {
    expect(countSessionsForAI([s(1), s(AI_HISTORY_DAYS + 1), s(90)])).toBe(1);
  });

  it("counts a session on the window boundary", () => {
    // Exactly AI_HISTORY_DAYS old — the comparison is inclusive.
    expect(countSessionsForAI([s(AI_HISTORY_DAYS)])).toBe(1);
  });

  it("returns zero for no sessions", () => {
    expect(countSessionsForAI([])).toBe(0);
  });

  it("keeps the AI threshold reachable within the window", () => {
    // Guards against someone lowering AI_HISTORY_DAYS below what the gate needs.
    expect(MIN_SESSIONS_FOR_AI).toBeGreaterThan(0);
    expect(AI_HISTORY_DAYS).toBeGreaterThanOrEqual(MIN_SESSIONS_FOR_AI);
  });
});
