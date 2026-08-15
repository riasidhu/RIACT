"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { createClient } from "@/lib/supabase";
import { User, Mail, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentEmail, setCurrentEmail] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  const [nameMsg, setNameMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [emailMsg, setEmailMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setCurrentEmail(user.email ?? "");
      setEmail(user.email ?? "");
      setName((user.user_metadata?.full_name as string | undefined) ?? "");
      setLoading(false);
    });
  }, [supabase, router]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg(null);
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setSavingName(false);
    if (error) {
      setNameMsg({ type: "err", text: error.message });
      return;
    }
    setNameMsg({ type: "ok", text: "Name updated." });
    router.refresh();
  }

  async function handleSaveEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailMsg(null);
    const trimmed = email.trim();
    if (trimmed === currentEmail) {
      setEmailMsg({ type: "err", text: "That's already your email." });
      return;
    }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setSavingEmail(false);
    if (error) {
      setEmailMsg({ type: "err", text: error.message });
      return;
    }
    setEmailMsg({
      type: "ok",
      text: `Confirmation sent to ${trimmed}. Click the link in that email to finish the change.`,
    });
  }

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="mb-2 flex items-center gap-2">
          <SettingsIcon size={22} className="text-pink-500" />
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        </div>
        <p className="mb-8 text-slate-500">Manage your account details.</p>

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          <div className="space-y-6">
            {/* Display name */}
            <section className="rounded-xl bg-white border border-slate-100 shadow-sm p-6">
              <div className="mb-4 flex items-center gap-2">
                <User size={16} className="text-pink-500" />
                <h2 className="text-lg font-semibold text-slate-900">Display name</h2>
              </div>
              <form onSubmit={handleSaveName} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-slate-500">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300 transition-colors"
                    placeholder="Your name"
                  />
                </div>
                {nameMsg && (
                  <p className={`text-sm ${nameMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
                    {nameMsg.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={savingName}
                  className="rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-pink-500 disabled:opacity-50 transition-all duration-150"
                >
                  {savingName ? "Saving…" : "Save name"}
                </button>
              </form>
            </section>

            {/* Email */}
            <section className="rounded-xl bg-white border border-slate-100 shadow-sm p-6">
              <div className="mb-4 flex items-center gap-2">
                <Mail size={16} className="text-pink-500" />
                <h2 className="text-lg font-semibold text-slate-900">Email address</h2>
              </div>
              <form onSubmit={handleSaveEmail} className="space-y-4">
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
                  <p className="mt-1.5 text-xs text-slate-400">
                    Changing your email sends a confirmation link to the new address. The change takes effect once you confirm.
                  </p>
                </div>
                {emailMsg && (
                  <p className={`text-sm ${emailMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
                    {emailMsg.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={savingEmail}
                  className="rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-pink-500 disabled:opacity-50 transition-all duration-150"
                >
                  {savingEmail ? "Saving…" : "Update email"}
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
