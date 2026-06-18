# RIACT — Record, Insight, Analyze, Coach, Track

> AI-powered study habit tracker built for the **USAII Global Hackathon 2026** — Undergraduate Track, *AI for Life & Work*.

**Live demo:** https://riact-riasidhus-projects.vercel.app

---

## What is RIACT?

Students don't know where or when they study most effectively. Without data, they repeat unproductive habits and fail to spot burnout before it hits.

RIACT lets students log study sessions by location and time, tracks breaks automatically, and after just 3 sessions uses AI to surface patterns, detect burnout signals, and give personalized coaching — turning invisible study habits into actionable insights.

---

## Features

### Study Session Tracking
- Start a session at any location (library, café, home, etc.)
- Record breaks mid-session — net study time is calculated automatically
- Review each session before saving with full edit support

### AI Insights
- **Pattern recognition** — detects which location and time of day produces your most focused study time
- **Burnout detection** — monitors signals like shorter sessions, more frequent breaks, late-night cramming, and declining goal completion
- **Personalized recommendations** — GPT-4o-mini analyzes your data and gives specific, actionable tips based on your own patterns

### AI Study Coach
- Live chat with an AI coach that has full context of your recent sessions and goals
- Ask anything: "When is my best time to study?", "Am I at risk of burnout?", "What should I focus on this week?"

### AI Weekly Study Plan
- Generates a personalised Mon–Sun study plan based on your historical patterns and active goals
- Shows recommended hours, location, and a focus tip per day

### Dashboard
- All-time and weekly stats at a glance
- Location pie chart (yesterday's sessions)
- Daily and weekly reports with date pickers
- AI recommendations inline in the weekly report

### Goals
- Set daily or weekly study hour targets, optionally tied to a specific location
- Progress bars track completion in real time
- Mark goals complete or delete them with confirmation

### Burnout Banner
- Surfaces a visible warning when burnout signals are detected
- Always links to resources — never makes clinical claims

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript, Tailwind CSS) |
| Auth & Database | Supabase (row-level security on every table) |
| AI | OpenAI API — GPT-4o-mini |
| Hosting | Vercel |
| Version control | GitHub |

---

## AI Architecture

Session data (location, net study time, break patterns, timestamps) is stored in Supabase with RLS so users only ever see their own records. When AI features are triggered:

1. The server-side API route fetches the user's last 30 days of sessions and active goals via a Bearer-token authenticated Supabase client
2. That context is passed to GPT-4o-mini with a structured prompt
3. The response is returned to the client — for insights as bullet points, for the weekly plan as structured JSON, for the coach as a conversational reply

JWT decoding happens locally (no extra network round-trip) to keep latency under Vercel's serverless function timeout.

---

## Responsible AI Design

**Human-in-the-loop:** The AI detects burnout signals and surfaces warnings — but never tells the user they *are* burned out. The user decides what action to take.

**Guardrails:** The AI never makes medical or clinical claims. Burnout warnings always include links to university mental health resources. The coach is explicitly constrained to study habit advice.

---

## Running Locally

```bash
npm install
```

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Team

Built by **Ria Sidhu** for the USAII Global Hackathon 2026.

---

*Record · Insight · Analyze · Coach · Track*
