import Link from "next/link";
import RiactLogo from "@/components/RiactLogo";
import LandingDemo from "@/components/LandingDemo";
import { BookOpen, Brain, Flame, MapPin, Shield, Target } from "lucide-react";

export const dynamic = "force-dynamic";

const features = [
  {
    icon: MapPin,
    color: "bg-pink-50 text-pink-500",
    title: "Location-based tracking",
    desc: "Log sessions at the library, a café, or home. Discover which spots make you most productive.",
  },
  {
    icon: Brain,
    color: "bg-purple-50 text-purple-500",
    title: "AI-powered insights",
    desc: "After a few sessions, RIACT's AI analyzes your patterns and gives personalized study tips.",
  },
  {
    icon: Flame,
    color: "bg-orange-50 text-orange-400",
    title: "Burnout detection",
    desc: "Spot warning signs before they hit — late-night cramming, shrinking break frequency, and more.",
  },
  {
    icon: Target,
    color: "bg-green-50 text-green-500",
    title: "Goal tracking",
    desc: "Set weekly or daily study hour targets. Watch progress bars fill as you hit your goals.",
  },
  {
    icon: BookOpen,
    color: "bg-blue-50 text-blue-500",
    title: "Session history",
    desc: "Every session is saved — review past weeks, compare locations, and spot your best days.",
  },
  {
    icon: Shield,
    color: "bg-slate-50 text-slate-500",
    title: "Private & secure",
    desc: "Your data is yours. Authenticated accounts with row-level security on every record.",
  },
];

const steps = [
  { num: "01", title: "Create a free account", desc: "Sign up with your university email in under 30 seconds." },
  { num: "02", title: "Log a study session", desc: "Pick a location, hit start, take breaks, and end when you're done." },
  { num: "03", title: "Get AI insights", desc: "After 3 sessions, RIACT's AI starts coaching you with personalised tips." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── Hero / Navbar (pink gradient banner) ── */}
      <section className="relative overflow-hidden" style={{background: "linear-gradient(160deg, #ff6eb4 0%, #ec4899 40%, #c026d3 100%)"}}>
        {/* Subtle shine overlay */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-pink-300/20 blur-3xl" />
        </div>

        {/* Nav inside the banner */}
        <div className="relative mx-auto flex max-w-6xl items-center justify-end px-6 pt-5">
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="rounded-xl px-5 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
            >
              Log in
            </Link>
            <Link
              href="/auth"
              className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-pink-600 shadow-md hover:bg-pink-50 transition-all"
            >
              Get started free
            </Link>
          </div>
        </div>

        {/* Centred logo + headline */}
        <div className="relative mx-auto max-w-3xl text-center px-6 pt-12 pb-20">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="flex items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm shadow-xl p-6">
              <RiactLogo variant="sidebar" />
            </div>
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl">
            Study smarter.<br />
            <span className="text-white/80">Beat burnout.</span>
          </h1>

          <p className="mt-6 text-lg text-pink-100 leading-relaxed max-w-xl mx-auto">
            RIACT tracks your study sessions, detects burnout signals, and gives you
            AI-powered coaching — so you can focus on learning, not guessing.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth"
              className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-pink-600 shadow-xl hover:bg-pink-50 transition-all"
            >
              Start tracking for free →
            </Link>
            <Link
              href="/auth"
              className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-medium text-white hover:bg-white/10 transition-all"
            >
              Log in to my account
            </Link>
          </div>

          <p className="mt-4 text-xs text-pink-200">No credit card · Free to use · Works on any device</p>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section className="py-20 px-6 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-2xl font-bold text-slate-900">See it in action</h2>
          <p className="mb-12 text-center text-sm text-slate-400">Watch how a typical study session flows through RIACT</p>
          <LandingDemo />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-slate-900">How it works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.num} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
                <p className="text-4xl font-black text-pink-200 mb-3">{step.num}</p>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-2xl font-bold text-slate-900">Everything you need to study well</h2>
          <p className="mb-12 text-center text-sm text-slate-400">
            Record · Insight · Analyze · Coach · Track
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 hover:shadow-md hover:border-pink-100 transition-all">
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon size={18} />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-2xl rounded-3xl bg-gradient-to-br from-pink-500 to-pink-600 p-12 text-center shadow-2xl shadow-pink-300/40">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to study smarter?</h2>
          <p className="text-pink-100 mb-8 text-sm leading-relaxed">
            Join students already using RIACT to track sessions, hit goals, and stay ahead of burnout.
          </p>
          <Link
            href="/auth"
            className="inline-block rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-pink-600 shadow-lg hover:bg-pink-50 transition-all"
          >
            Create your free account →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-8 px-6 text-center">
        <p className="text-xs text-slate-400">
          © 2026 RIACT · Record · Insight · Analyze · Coach · Track
        </p>
      </footer>
    </div>
  );
}
