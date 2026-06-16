"use client";

import { useEffect, useState } from "react";
import { Brain, Coffee, MapPin, Play, Square, Clock, Target, TrendingUp } from "lucide-react";

// ── Each "screen" the demo cycles through ──────────────────────────────────
type Screen = "new" | "active" | "review" | "insights";

const SEQUENCE: Screen[] = ["new", "active", "review", "insights"];
const DURATIONS: Record<Screen, number> = {
  new: 2800,
  active: 3200,
  review: 3000,
  insights: 3500,
};

const LABELS: Record<Screen, string> = {
  new:      "1. Start a session",
  active:   "2. Track your time",
  review:   "3. Review your stats",
  insights: "4. Get AI coaching",
};

// ── Fake timer animation ───────────────────────────────────────────────────
function useCountUp(running: boolean) {
  const [secs, setSecs] = useState(5460); // start at 1h 31m
  useEffect(() => {
    if (!running) { setSecs(5460); return; }
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ── Screen components ──────────────────────────────────────────────────────

function NewSessionScreen() {
  const [selected, setSelected] = useState("");
  useEffect(() => {
    // Animate: after 600ms auto-select "Main Library"
    const t = setTimeout(() => setSelected("Main Library"), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-5">
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Choose location</p>
        <div className="space-y-2">
          {["Main Library", "Café Nero", "Home Desk"].map((loc) => (
            <div
              key={loc}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-all duration-300 ${
                selected === loc
                  ? "border-pink-400 bg-pink-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <MapPin size={13} className={selected === loc ? "text-pink-500" : "text-slate-300"} />
              <span className={`text-sm font-medium ${selected === loc ? "text-pink-600" : "text-slate-600"}`}>{loc}</span>
              {selected === loc && (
                <span className="ml-auto h-2 w-2 rounded-full bg-pink-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-500 ${
          selected ? "bg-gradient-to-r from-pink-500 to-pink-600 shadow-lg shadow-pink-200" : "bg-slate-200"
        }`}
      >
        <Play size={13} />
        Begin Session
      </button>
    </div>
  );
}

function ActiveSessionScreen() {
  const time = useCountUp(true);
  const [onBreak, setOnBreak] = useState(false);

  useEffect(() => {
    // At 1.8s, animate a break being taken
    const t = setTimeout(() => setOnBreak(true), 1800);
    return () => { clearTimeout(t); setOnBreak(false); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-5">
      {/* Location pill */}
      <div className="flex items-center gap-1.5 rounded-full bg-pink-50 border border-pink-100 px-3 py-1">
        <MapPin size={11} className="text-pink-400" />
        <span className="text-xs font-medium text-pink-600">Main Library</span>
      </div>

      {/* Timer */}
      <div className={`w-full rounded-2xl p-5 text-center transition-all duration-500 ${
        onBreak
          ? "bg-amber-50 border border-amber-200"
          : "bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg shadow-pink-200"
      }`}>
        <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${onBreak ? "text-amber-500" : "text-pink-200"}`}>
          {onBreak ? "On Break" : "Studying"}
        </p>
        <p className={`text-3xl font-black tabular-nums ${onBreak ? "text-amber-700" : "text-white"}`}>{time}</p>
        <div className={`mt-1.5 mx-auto h-1.5 w-1.5 rounded-full ${onBreak ? "bg-amber-400" : "bg-white/60"} animate-pulse`} />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 w-full">
        <button className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all duration-300 ${
          onBreak
            ? "bg-pink-500 text-white shadow-md shadow-pink-200"
            : "bg-amber-50 border border-amber-200 text-amber-700"
        }`}>
          <Coffee size={12} />
          {onBreak ? "Resume" : "Take Break"}
        </button>
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-50 border border-red-200 py-2.5 text-xs font-semibold text-red-500">
          <Square size={12} />
          End Session
        </button>
      </div>
    </div>
  );
}

function ReviewScreen() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 p-4 text-center shadow-md shadow-pink-200 transition-all duration-500 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <p className="text-[10px] text-pink-200 uppercase tracking-wide mb-1">Net Study</p>
          <p className="text-2xl font-black text-white">1h 42m</p>
        </div>
        <div className={`rounded-xl bg-white border border-slate-100 p-4 text-center transition-all duration-500 delay-100 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Total</p>
          <p className="text-2xl font-black text-slate-800">2h 04m</p>
        </div>
      </div>

      <div className={`rounded-xl bg-white border border-slate-100 p-4 transition-all duration-500 delay-200 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Breaks taken</p>
        <div className="space-y-1.5">
          {[["Break 1", "10:22 AM", "10:37 AM", "15 min"], ["Break 2", "12:05 PM", "12:20 PM", "15 min"]].map(([label, start, end, dur]) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{label}</span>
              <span className="text-slate-400">{start} – {end}</span>
              <span className="font-semibold text-pink-500">{dur}</span>
            </div>
          ))}
        </div>
      </div>

      <button className={`rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-500 delay-300 ${show ? "opacity-100" : "opacity-0"}`}>
        Save Session
      </button>
    </div>
  );
}

function InsightsScreen() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 400),
      setTimeout(() => setStep(2), 1000),
      setTimeout(() => setStep(3), 1700),
      setTimeout(() => setStep(4), 2400),
    ];
    return () => { timers.forEach(clearTimeout); setStep(0); };
  }, []);

  const recs = [
    "Your best focus window is 9 AM–1 PM. Prioritise hard tasks then.",
    "Main Library sessions average 47 min longer than café sessions.",
    "Try a 10-min break after every 90 min to sustain deep work.",
  ];

  return (
    <div className="flex flex-col gap-3 p-5">
      {/* Burnout badge */}
      <div className={`flex items-center gap-2 transition-all duration-500 ${step >= 1 ? "opacity-100" : "opacity-0"}`}>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50">
          <TrendingUp size={13} className="text-green-500" />
        </div>
        <span className="text-xs font-semibold text-slate-700">Burnout Risk</span>
        <span className="ml-auto rounded-full border border-green-200 bg-green-50 px-3 py-0.5 text-xs font-semibold text-green-700">Low Risk</span>
      </div>

      {/* Pattern */}
      <div className={`rounded-lg bg-pink-50 border border-pink-100 p-3 transition-all duration-500 ${step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
        <div className="flex items-center gap-1.5 mb-1">
          <Brain size={11} className="text-pink-500" />
          <p className="text-[10px] font-semibold text-pink-500 uppercase tracking-wide">Pattern Summary</p>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">You study best in the mornings at the Main Library. Your break frequency is healthy.</p>
      </div>

      {/* Recommendations */}
      <div className="space-y-1.5">
        {recs.map((r, i) => (
          <div
            key={i}
            className={`flex gap-2 text-xs text-slate-600 transition-all duration-500 ${
              step >= i + 2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
            }`}
          >
            <span className="text-pink-400 shrink-0 mt-0.5">→</span>
            <span>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main demo component ────────────────────────────────────────────────────

export default function LandingDemo() {
  const [screenIdx, setScreenIdx] = useState(0);
  const [fading, setFading] = useState(false);

  const screen = SEQUENCE[screenIdx];

  useEffect(() => {
    const dur = DURATIONS[screen];
    const fadeAt = dur - 400;

    const fadeTimer = setTimeout(() => setFading(true), fadeAt);
    const nextTimer = setTimeout(() => {
      setFading(false);
      setScreenIdx((i) => (i + 1) % SEQUENCE.length);
    }, dur);

    return () => { clearTimeout(fadeTimer); clearTimeout(nextTimer); };
  }, [screenIdx, screen]);

  const screens: Record<Screen, React.ReactNode> = {
    new:      <NewSessionScreen />,
    active:   <ActiveSessionScreen />,
    review:   <ReviewScreen />,
    insights: <InsightsScreen />,
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Step pills */}
      <div className="flex gap-2 flex-wrap justify-center">
        {SEQUENCE.map((s, i) => (
          <button
            key={s}
            onClick={() => { setFading(false); setScreenIdx(i); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-300 ${
              i === screenIdx
                ? "bg-pink-500 text-white shadow-md shadow-pink-200"
                : "bg-slate-100 text-slate-500 hover:bg-pink-50 hover:text-pink-500"
            }`}
          >
            {LABELS[s]}
          </button>
        ))}
      </div>

      {/* Browser chrome mockup */}
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden bg-white">
        {/* Browser top bar */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 rounded-md bg-white border border-slate-200 px-3 py-1 text-center">
            <span className="text-[10px] text-slate-400">riact.app</span>
          </div>
        </div>

        {/* Mini sidebar + content */}
        <div className="flex" style={{ minHeight: 280 }}>
          {/* Tiny sidebar */}
          <div className="flex flex-col w-[52px] shrink-0 items-center py-3 gap-3" style={{background: "linear-gradient(160deg, #ff6eb4 0%, #ec4899 40%, #c026d3 100%)"}}>
            <div className="text-[8px] font-black text-white tracking-widest" style={{writingMode:"vertical-rl", transform:"rotate(180deg)"}}>RIACT</div>
            <div className="mt-2 flex flex-col gap-2">
              {[Clock, TrendingUp, Brain, Target, MapPin].map((Icon, i) => (
                <div key={i} className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                  (screen === "new" || screen === "active" || screen === "review") && i === 0 ? "bg-white/25" :
                  screen === "insights" && i === 2 ? "bg-white/25" : ""
                }`}>
                  <Icon size={13} className="text-white/70" />
                </div>
              ))}
            </div>
          </div>

          {/* Screen content */}
          <div
            className="flex-1 transition-all duration-300"
            style={{ opacity: fading ? 0 : 1, transform: fading ? "translateY(4px)" : "translateY(0)" }}
          >
            {/* Screen title */}
            <div className="border-b border-slate-100 px-4 py-2.5">
              <p className="text-xs font-semibold text-slate-700">
                {screen === "new" && "New Session"}
                {screen === "active" && "Session Active"}
                {screen === "review" && "Session Review"}
                {screen === "insights" && "AI Insights"}
              </p>
            </div>
            {screens[screen]}
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {SEQUENCE.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFading(false); setScreenIdx(i); }}
            className={`rounded-full transition-all duration-300 ${
              i === screenIdx ? "w-6 h-2 bg-pink-500" : "w-2 h-2 bg-slate-200 hover:bg-pink-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
