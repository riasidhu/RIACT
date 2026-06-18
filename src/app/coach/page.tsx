"use client";

import { useEffect, useRef, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { createClient } from "@/lib/supabase";
import { Brain, Send, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "When is my best time to study?",
  "Am I at risk of burnout?",
  "How can I improve my focus?",
  "What study location works best for me?",
];

export default function CoachPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        setToken(session.access_token);
        // Greeting message
        setMessages([
          {
            role: "assistant",
            content: "Hey! I'm your RIACT Study Coach 👋 I've already looked at your recent sessions and goals. Ask me anything about your study habits, focus patterns, or how to plan your week.",
          },
        ]);
      }
    });
  }, [supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || !userId || !token || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);

      const res = await fetch("/api/chat", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          // Only send last 10 messages to keep payload small
          messages: next.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      clearTimeout(timeout);

      if (res.ok) {
        const { reply } = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } else {
        const { error } = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: error ?? "Something went wrong. Try again!" }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Request timed out. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-md shadow-pink-200">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Study Coach</h1>
            <p className="text-xs text-slate-400">Powered by your session data · GPT-4o-mini</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-green-700">Online</span>
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-4 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-pink-600 mr-2 mt-0.5">
                  <Brain size={12} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-tr-sm shadow-md shadow-pink-200"
                    : "bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-pink-600 mr-2 mt-0.5">
                <Brain size={12} className="text-white" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions */}
        {messages.length <= 1 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {STARTERS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-600 hover:bg-pink-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="mt-3 flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm focus-within:border-pink-400 focus-within:ring-1 focus-within:ring-pink-300 transition-all">
            <Sparkles size={14} className="text-pink-400 shrink-0" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              placeholder="Ask your coach anything…"
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              disabled={loading}
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-md shadow-pink-200 hover:from-pink-400 hover:to-pink-500 disabled:opacity-40 transition-all"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
