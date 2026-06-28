import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { subDays } from "date-fns";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getUserIdFromJwt(token: string): string | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, messages } = await request.json();

    const token = request.headers.get("Authorization")?.replace("Bearer ", "").trim();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tokenUserId = getUserIdFromJwt(token);
    if (!tokenUserId || tokenUserId !== user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );

    const since = subDays(new Date(), 30).toISOString();
    const [{ data: sessions }, { data: goals }, { data: schedule }] = await Promise.all([
      supabase.from("sessions").select("*").eq("user_id", user_id).gte("start_time", since).not("end_time", "is", null),
      supabase.from("goals").select("*").eq("user_id", user_id).eq("is_active", true),
      supabase.from("schedule").select("*").eq("user_id", user_id).order("day_of_week").order("start_time"),
    ]);

    const context = {
      sessions: (sessions ?? []).map((s) => ({
        location: s.location_name,
        date: s.start_time?.split("T")[0],
        net_minutes: s.net_study_minutes,
        total_minutes: s.total_minutes,
      })),
      active_goals: (goals ?? []).map((g) => ({
        target: `${g.target_hours}h ${g.timeframe}`,
        location: g.location_name ?? "any",
      })),
      class_schedule: (schedule ?? []).map((c) => ({
        course: c.course_name,
        day: c.day_of_week,
        time: `${c.start_time}–${c.end_time}`,
        location: c.location ?? "unspecified",
      })),
    };

    const system = `You are RIACT Coach — a friendly, encouraging AI study coach built into the RIACT study tracking app. You have full context of the student's recent study sessions, goals, and weekly class schedule. Give specific, data-driven advice. Be warm but concise — keep every reply under 120 words. When suggesting study times, avoid the student's class hours. Never make up data not in the context.

Student context (last 30 days):
${JSON.stringify(context)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 180,
      messages: [{ role: "system", content: system }, ...messages],
    });

    const reply = completion.choices[0]?.message?.content ?? "Sorry, I couldn't generate a response. Try again!";
    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Chat API error:", msg);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
