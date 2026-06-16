"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import RiactLogo from "@/components/RiactLogo";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-pink-100/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-pink-50/80 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center justify-center rounded-3xl bg-gradient-to-br from-pink-400 to-pink-600 shadow-xl shadow-pink-300/40 p-6 mb-4">
            <RiactLogo variant="auth" />
          </div>
          <p className="text-slate-500 text-sm">Track study sessions. Beat burnout.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-slate-500">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300 transition-colors"
                placeholder="you@university.edu"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-slate-500">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-pink-500 disabled:opacity-50 transition-all duration-150 mt-2"
            >
              {loading ? "Loading..." : isSignUp ? "Sign up" : "Log in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-pink-400 hover:text-pink-300 transition-colors"
            >
              {isSignUp ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Record · Insight · Analyze · Coach · Track
        </p>
      </div>
    </div>
  );
}
