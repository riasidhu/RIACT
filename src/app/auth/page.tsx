"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import RiactLogo from "@/components/RiactLogo";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDuplicateEmail(false);
    setLoading(true);

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (isSignUp && (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already"))) {
        setDuplicateEmail(true);
      } else {
        setError(authError.message);
      }
      return;
    }

    router.push("/home");
    router.refresh();
  }

  async function handleResetPassword() {
    if (!email) {
      setError("Enter your email above first.");
      return;
    }
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    setResetSent(true);
    setDuplicateEmail(false);
  }

  async function handleSetNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPasswordUpdated(true);
    setIsRecovery(false);
    setTimeout(() => router.push("/home"), 1500);
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

          {/* Password recovery flow */}
          {isRecovery ? (
            <>
              <h2 className="mb-2 text-xl font-semibold text-slate-900">Set a new password</h2>
              <p className="mb-6 text-sm text-slate-500">Choose a new password for your account.</p>

              {error && (
                <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-slate-500">New password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300 transition-colors"
                    placeholder="••••••••"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-pink-500 disabled:opacity-50 transition-all duration-150 mt-2"
                >
                  {loading ? "Saving…" : "Update password"}
                </button>
              </form>
            </>
          ) : passwordUpdated ? (
            <div className="py-4 text-center">
              <p className="text-green-700 font-semibold mb-1">Password updated!</p>
              <p className="text-sm text-slate-500">Redirecting you to the app…</p>
            </div>
          ) : (
            <>
              <h2 className="mb-6 text-xl font-semibold text-slate-900">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h2>

              {error && (
                <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {duplicateEmail && (
                <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                  An account already exists with this email.{" "}
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="font-semibold underline hover:text-amber-900 transition-colors"
                  >
                    Reset your password
                  </button>
                  {" "}or{" "}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setDuplicateEmail(false); }}
                    className="font-semibold underline hover:text-amber-900 transition-colors"
                  >
                    log in instead
                  </button>.
                </div>
              )}

              {resetSent && (
                <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                  Password reset email sent! Check your inbox.
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
                    placeholder="you@email.com"
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

              {!isSignUp && (
                <p className="mt-3 text-center text-xs">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-slate-400 hover:text-pink-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                </p>
              )}

              <p className="mt-4 text-center text-sm text-slate-500">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                    setDuplicateEmail(false);
                    setResetSent(false);
                  }}
                  className="text-pink-400 hover:text-pink-300 transition-colors"
                >
                  {isSignUp ? "Log in" : "Sign up"}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Record · Insight · Analyze · Coach · Track
        </p>
      </div>
    </div>
  );
}
