# RIACT — Record, Insight, Analyze, Coach, Track

**RIACT is an AI-powered study habit tracker that helps students understand where and when they study best, detect burnout before it hits and get personalised coaching from an AI that knows their data.**

**Live demo:** https://riact-riasidhus-projects.vercel.app

---

## The Problem

Most students study hard. Very few know whether they're studying smart. Without data, it's impossible to tell whether the library at 9am actually produces better focus than your bedroom at midnight, or whether the gradual shortening of your sessions and increase in breaks is a sign of burnout creeping in. These patterns exist — they're just invisible.

RIACT makes them visible. It tracks study sessions by location and time, calculates net study time by automatically accounting for breaks, and after just three sessions starts using AI to surface patterns, detect risk signals and give coaching that's grounded in the user's own data rather than generic advice.

---

## What It Does

**Session Tracking** is the foundation. Users start a session at any location — a library, a café, home — and RIACT runs a live timer. Breaks can be recorded mid-session, and when the session ends the user sees a full breakdown: start time, end time, every break, net study time versus total time at that location. Everything is editable before saving, and nothing gets locked in without the user's sign-off.

**AI Insights** unlock after three sessions. The Insights page sends the user's session history to GPT-4o-mini, which analyses patterns across location, time of day, break frequency, and session length to surface personalised recommendations. If the AI identifies that a user consistently produces their best net study time on Tuesday mornings at the library, it says so specifically — not generically.

**Burnout Detection** runs continuously in the background. A deterministic, rule-based function monitors concrete signals — sessions getting shorter over time, breaks becoming more frequent, late-night cramming clustering, goal completion rates dropping — and surfaces a warning banner when enough signals are present. Critically, this system is entirely separate from the AI. No model ever makes a claim about a user's mental state. The banner shows what the data looks like. The user decides what it means.

**The AI Study Coach** is a live chat interface where users can ask anything about their study habits. The model receives the last 30 days of sessions and active goals as context with every message, so its answers are grounded in real data. Ask it when your best study window is, whether your current patterns suggest burnout risk or what you should prioritise this week — and it responds with answers specific to you, not generic study tips.

**The AI Weekly Plan** generates a personalised Monday-to-Sunday study schedule based on historical patterns. Rather than spreading hours evenly across the week, the model analyses which days and locations have historically produced the most focused work and builds a realistic plan around that. Each day includes a recommended location, a target number of hours, and a short focus tip. Rest days are included — recovery is part of studying smarter, not just working harder.

**Goals and Progress Tracking** lets users set daily or weekly study hour targets, optionally tied to a specific location. Progress bars update in real time as sessions are logged, and goals can be marked complete or deleted with a confirmation prompt.

**Class Schedule Integration** allows users to enter their university timetable — course name, day, start and end time, and classroom location. Classes can be given active date ranges so a September semester schedule doesn't clutter the summer view. The timetable renders as a visual weekly grid with pink shaded blocks for class time, leaving white space that instantly shows available study windows. Users can skip a single week's occurrence of a class — for example to free up a Tuesday afternoon for revision — without deleting the recurring entry. The skipped block shows as faded and cancelled for that week, and can be restored with one click. This full schedule is passed as context to both the AI Coach and the Weekly Plan generator, so the AI never suggests studying during class hours and plans sessions intelligently around lectures and tutorials.

**The Dashboard** brings everything together — all-time hours, weekly stats, a location breakdown pie chart, daily and weekly reports with date pickers, and AI recommendations inline in the weekly view.

---

## Tech Stack

RIACT is built on **Next.js 16** with the App Router, TypeScript throughout and Tailwind CSS for styling. The database and authentication layer is **Supabase** — PostgreSQL under the hood, with row-level security on every table so users can only ever query their own data. The AI features run through the **OpenAI API** using GPT-4o-mini. Everything is deployed on **Vercel**.

Data visualisation uses Recharts. Icons are from Lucide React. Date handling uses date-fns.

---

## AI Architecture

When a user triggers an AI feature, a Next.js serverless API route fetches their last 30 days of sessions, active goals, and full class schedule from Supabase using a Bearer-token authenticated client — meaning RLS applies server-side and the route can only access data belonging to the authenticated user. That data is formatted as structured context and passed to GPT-4o-mini with a task-specific prompt.

For the Insights page, the model returns personalised recommendation bullet points. For the Weekly Plan, the endpoint uses `response_format: json_object` to return a structured day-by-day schedule. For the AI Coach, the model receives the full conversation history alongside the session context and responds conversationally.

JWT decoding happens locally on the server using a manual base64 decode — no extra network round-trip — to keep latency well under Vercel's 10-second serverless function timeout. Client-side AbortControllers cap all AI requests at 9 seconds and fail gracefully if the timeout is hit.

---

## Responsible AI Design

The most important design decision in RIACT was keeping burnout detection entirely separate from the AI. Burnout has real mental health implications, and a model labelling a student as burned out could be mistaken for a clinical assessment — which it is not qualified to make. The burnout detection system is a deterministic rule-based function: it checks concrete signals in the data, computes a risk level, and surfaces a warning. No model is involved at any point in that flow.

Every burnout warning is explicitly labelled as a signal detected in study data, not a diagnosis, and always surfaces a link to mental health resources rather than prescribing a course of action. The AI Coach is system-prompted to stay strictly within study habit advice and to redirect any mental health topics to professional support rather than engaging with them.

The AI recommends. The rules engine warns. The student decides.

---

## Running Locally

Clone the repo and install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root with the following:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
```

Then start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

Built by **Ria Sidhu**.

*Record · Insight · Analyze · Coach · Track*
