"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { X } from "lucide-react";

const DISMISS_KEY = "namePromptDismissed";

export default function NamePrompt() {
  const supabase = createClient();
  const router = useRouter();

  // Hidden until we confirm it wasn't dismissed before — avoids a flash.
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) !== "1") setVisible(true);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setVisible(false);
    router.refresh();
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore storage failures — just hide for this visit.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative mb-8 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 p-5 shadow-lg shadow-pink-200">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-pink-200 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
      <p className="text-sm font-semibold text-white">What should we call you?</p>
      <p className="mt-1 text-xs text-pink-100">
        Add your name so RIACT can greet you instead of your email.
      </p>
      <form onSubmit={handleSave} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="flex-1 rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm text-white placeholder-pink-100 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/50 transition-colors"
          autoFocus
        />
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-50 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {saving ? "Saving…" : "Save name"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-white">{error}</p>}
    </div>
  );
}
