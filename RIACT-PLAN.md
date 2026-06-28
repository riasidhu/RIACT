# RIACT — Project Plan

**R**ecord, **I**nsight, **A**nalyze, **C**oach, **T**rack

A study habit tracking web app that uses AI to help university students understand where and when they study best, detect burnout early, and get personalized recommendations.

---

## Hackathon Info

- **Track:** Undergraduate — AI for Life & Work
- **Challenge Direction:** Productivity: Build the "Second Brain" for Real Life
- **Team size:** 2
- **Build window:** June 14–21, 2026
- **Submission deadline:** June 21, 11:59 PM ET

---

## The Problem

Students don't know where or when they study most effectively. Without data, they can't optimize their habits or recognize burnout before it hits.

## The Solution

RIACT lets students log study sessions by location and time, tracks breaks, and after 3 sessions uses AI to detect patterns, predict burnout, and recommend better study habits.

---

## AI Features

1. **Pattern Recognition** — detects which location and time of day produces the most focused study time (based on net study time vs. breaks per location)
2. **Burnout Detection** — monitors signals like shorter sessions, more frequent breaks, late-night cramming, and declining goal completion to warn the user before burnout hits
3. **Personalized Recommendations** — tells the user specifically where and when to study based on their own data (e.g. "Your peak focus window is Tuesday mornings at SFU Bennett")

AI kicks in after 3 logged sessions.

---

## Judging Criteria Alignment

| Criteria | How RIACT addresses it |
|---|---|
| Problem Understanding | Clear user (university students), clear problem (invisible study habits leading to burnout) |
| AI Reasoning | AI justified — pattern detection across location/time data is not achievable with a spreadsheet |
| Solution Design | Clear architecture: user logs → data stored → AI analyzes → insights surfaced |
| Impact & Decision Value | Helps students make better decisions about where/when to study and when to rest |
| Responsibility, Ethics & Limits | AI warns but never diagnoses burnout medically; user stays in control |

---

## Screens

### 1. Login / Sign Up
- Standard email/password auth
- Supabase handles this

### 2. Main Screen (Home)
**Sidebar (always visible):**
- Insights
- Previous Study Sessions
- Goals
- Account
- Resources & FAQ

**Main content — two states:**

State 1 (no sessions today):
- Active goals progress bars
- "Begin Study Session" button

State 2 (sessions logged today):
- Active goals progress bars
- List of today's sessions so far
- "Add New Session" button

### 3. Begin Study Session Screen
Fields:
- Location (pick from saved list or type manually)
- Start time (defaults to now, editable)
- Projected end time (your goal for this session)

Leads to active timer screen.

### 4. Active Timer Screen
- "Record Break" button (top)
- Pink live timer — counts up, pauses during breaks (middle)
- Current location (bottom)
- Projected end time (bottom)
- "End Session" button

**Break flow:**
1. Hit "Record Break" → auto-fills current time as break start (editable)
2. Hit "Start Break"
3. Return to app → enter break end time
4. Timer resumes

### 5. End Session Screen
Displayed after hitting "End Session":
- Location
- Start time
- End time
- All breaks (start + end times)
- Net study time / total time at location

User can manually edit any field → hits "Save Session"

### 6. Dashboard
**Top section:**
- Pie chart — hours per location (shows previous day's data by default)
- Total hours studied

**Bottom section:**
- Daily report (with date picker)
- Weekly report (with week picker)

**Daily report contains:**
- Total time studied
- Time per location (with and without breaks)
- Break frequency per location
- Burnout warning if triggered
- AI recommendations

**Weekly report contains:**
- Total hours for the week
- Hours per location across the week
- Break patterns across the week
- Burnout warning if triggered
- AI recommendations based on full week patterns

### 7. Goals Setup Screen
**Create a goal:**
- Time target (hours)
- Timeframe — daily or weekly
- Location — optional (specific or general)
- Save goal

Multiple active goals can run simultaneously.

**Previous goals section:**
- List of past goals
- One-click replicate

Progress bars for active goals shown on main screen.

### 8. Insights Page
- AI recommendations (best location, best time of day)
- Goal performance (are you consistently meeting daily/weekly goals?)
- Burnout section (current risk level, what signals triggered it, what to do)
- Resources (links for university students — study techniques, mental health, time management)

### 9. Location Manager
- Saved locations list (custom names e.g. "SFU Bennett Library")
- Add / edit / delete locations

---

## Session Data Structure

Each session logs:
- Location
- Start time
- End time
- Breaks (start + end time of each break)
- Net study time (excluding breaks)
- Total time at location (including breaks)

Each day = multiple sessions across different locations.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Code editor | Cursor (cursor.com) — AI-powered |
| Frontend | Next.js |
| Database + Auth | Supabase |
| AI features | OpenAI API |
| Hosting | Vercel |
| Version control | GitHub (this repo) |

---

## Responsible AI Design

**Human-in-the-loop:** AI detects burnout signals and surfaces warnings — but never tells the user they ARE burned out. The user decides what action to take.

**Guardrail:** AI never makes medical or clinical claims. Burnout warnings always include a link to university mental health resources. Crisis situations always surface a hotline regardless of AI classification.

---

## Timeline

| Date | Task |
|---|---|
| Now – June 6 | Registration, qualifier prep |
| June 7–10 | Submit qualifier responses |
| June 12 | Receive qualifier results |
| June 14 | Kickoff — begin building RIACT |
| June 14–21 | Build week |
| June 21 11:59 PM ET | Submit on Devpost |
| June 27 | Awards ceremony |

---

## Submission Checklist

- [ ] Qualifier approval code entered
- [ ] Project title + tagline + description filled
- [ ] Track and challenge direction selected
- [ ] AI architecture explanation (600 chars)
- [ ] Human-in-the-loop design (500 chars)
- [ ] Responsible AI guardrail (500 chars)
- [ ] Tools and data disclosure (800 chars)
- [ ] Pitch video 3–5 minutes (YouTube/Vimeo/Loom)
- [ ] Demo link works and is accessible
- [ ] All team members listed
- [ ] Submitted before June 21 11:59 PM ET
