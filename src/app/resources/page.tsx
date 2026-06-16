export const dynamic = "force-dynamic";

import AppLayout from "@/components/AppLayout";
import { createServerSupabase } from "@/lib/supabase-server";
import { Sparkles, Heart, Clock, Brain } from "lucide-react";

const STUDY_TECHNIQUES = [
  {
    title: "Pomodoro Technique",
    description:
      "Work in 25-minute focused blocks with 5-minute breaks. After four pomodoros, take a longer 15–30 minute break.",
  },
  {
    title: "Active Recall",
    description:
      "Test yourself on material instead of re-reading. Flashcards, practice problems, and teaching others strengthen memory.",
  },
  {
    title: "Environment Matching",
    description:
      "Study in the same location for similar subjects. RIACT helps you discover which spots work best for you.",
  },
  {
    title: "Spaced Repetition",
    description:
      "Review material at increasing intervals. Tools like Anki automate this for long-term retention.",
  },
];

const MENTAL_HEALTH = [
  {
    title: "Campus Counseling Services",
    description:
      "Most universities offer free or low-cost counseling. Check your school's health and wellness center.",
  },
  {
    title: "Crisis Text Line",
    description: "Text HOME to 741741 to connect with a trained crisis counselor, 24/7.",
    link: "https://www.crisistextline.org/",
  },
  {
    title: "NAMI — National Alliance on Mental Illness",
    description: "Education, support groups, and a helpline at 1-800-950-NAMI.",
    link: "https://www.nami.org/help",
  },
  {
    title: "988 Suicide & Crisis Lifeline",
    description: "Call or text 988 for free, confidential support.",
    link: "https://988lifeline.org/",
  },
];

const TIME_MANAGEMENT = [
  {
    title: "Time Blocking",
    description: "Assign specific time slots to tasks on your calendar. Include breaks and buffer time.",
  },
  {
    title: "Eisenhower Matrix",
    description:
      "Sort tasks by urgency and importance: do, schedule, delegate, or eliminate.",
  },
  {
    title: "Weekly Review",
    description:
      "Every Sunday, review the past week and plan the next. RIACT's weekly dashboard supports this habit.",
  },
];

const FAQ = [
  {
    q: "How does RIACT detect burnout?",
    a: "RIACT monitors session length trends, break frequency, late-night studying, and goal completion over the last 7 days. It surfaces warnings — never medical diagnoses.",
  },
  {
    q: "When does AI analysis kick in?",
    a: "After 3 logged sessions, RIACT's AI begins analyzing your patterns. More sessions mean more accurate recommendations.",
  },
  {
    q: "Can I edit a session after saving?",
    a: "Review all details on the end session screen before saving. You can edit times and breaks on that screen before confirming.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your sessions are stored securely and are only accessible to you when logged in.",
  },
  {
    q: "Is the burnout warning a medical diagnosis?",
    a: "No. RIACT's burnout warnings are data-driven signals only — not medical assessments. Always consult a professional if you're struggling.",
  },
];

export default async function ResourcesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppLayout userEmail={user?.email ?? ""}>
      <div className="max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Resources & FAQ</h1>
        <p className="mb-8 text-slate-500">
          Study techniques, mental health support, and answers to common questions.
        </p>

        {/* Our Story */}
        <section className="mb-10">
          <div className="rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 p-8 shadow-lg shadow-pink-200">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-pink-200" />
              <h2 className="text-lg font-semibold text-white uppercase tracking-wide">The Story Behind RIACT</h2>
            </div>
            <div className="space-y-4 text-pink-50 text-sm leading-relaxed">
              <p>
                RIACT was born from a personal frustration. As an undergraduate student, I found myself wondering why some study sessions felt incredibly productive while others felt like a complete waste of time — even when I studied for the same number of hours.
              </p>
              <p>
                I started manually tracking my sessions in a spreadsheet — logging where I studied, how long I stayed, how many breaks I took, and how I felt afterward. Over weeks, patterns started to emerge. I studied best at my undergraduate library at SFU on Tuesday and Thursday mornings. I was almost useless at home after 9pm. Coffee shops sounded great but my break frequency doubled there.
              </p>
              <p>
                The problem was that manually tracking all of this was tedious and easy to forget. The spreadsheet got messy. I started skipping days. The data became unreliable.
              </p>
              <p className="font-medium text-white">
                So I built RIACT — to do what I was doing manually, but better. Automatically. And with AI that can spot patterns I never would have noticed on my own.
              </p>
              <p>
                Now RIACT can do it for you. Log your sessions, and let the AI figure out where and when you truly work best — so you never have to guess again.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <Heart size={14} className="text-pink-300" />
              <p className="text-xs text-pink-200">Built by a student, for students.</p>
            </div>
          </div>
        </section>

        {/* Study Techniques */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-pink-500" />
            <h2 className="text-lg font-semibold text-slate-900">Study Techniques</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {STUDY_TECHNIQUES.map((item) => (
              <div key={item.title} className="rounded-xl bg-white border border-slate-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mental Health */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={16} className="text-pink-500" />
            <h2 className="text-lg font-semibold text-slate-900">Mental Health Resources</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {MENTAL_HEALTH.map((item) => (
              <div key={item.title} className="rounded-xl bg-white border border-slate-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
                {"link" in item && item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm text-pink-500 hover:text-pink-600 font-medium"
                  >
                    Learn more →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Time Management */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-pink-500" />
            <h2 className="text-lg font-semibold text-slate-900">Time Management</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TIME_MANAGEMENT.map((item) => (
              <div key={item.title} className="rounded-xl bg-white border border-slate-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-pink-500" />
            <h2 className="text-lg font-semibold text-slate-900">FAQ</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-xl bg-white border border-slate-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 mb-2">{item.q}</h3>
                <p className="text-sm text-slate-500">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
