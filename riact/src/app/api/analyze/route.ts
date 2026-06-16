import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { subDays } from "date-fns";
import { createServerSupabase } from "@/lib/supabase-server";
import type { AnalysisResult } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const since = subDays(new Date(), 30).toISOString();

    const { data: sessions } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", user_id)
      .gte("start_time", since)
      .not("end_time", "is", null);

    const sessionIds = (sessions ?? []).map((s) => s.id);
    let breaks: { session_id: string; start_time: string; end_time: string | null; duration_minutes: number | null }[] = [];

    if (sessionIds.length > 0) {
      const { data: brks } = await supabase
        .from("breaks")
        .select("*")
        .in("session_id", sessionIds);
      breaks = brks ?? [];
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        patterns: "Not enough session data yet. Log a few study sessions to unlock AI insights.",
        burnout_risk: "low" as const,
        burnout_signals: [],
        recommendations: [
          "Start logging sessions at your favorite study spots",
          "Set a daily or weekly study goal to track progress",
          "Try studying at different times to find your peak focus window",
        ],
      });
    }

    const payload = {
      sessions: sessions.map((s) => ({
        location: s.location_name,
        start: s.start_time,
        end: s.end_time,
        net_minutes: s.net_study_minutes,
        total_minutes: s.total_minutes,
      })),
      breaks: breaks.map((b) => ({
        session_id: b.session_id,
        start: b.start_time,
        end: b.end_time,
        duration_minutes: b.duration_minutes,
      })),
    };

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        patterns: "OpenAI API key not configured. Add OPENAI_API_KEY to your environment.",
        burnout_risk: "low" as const,
        burnout_signals: [],
        recommendations: [
          "Configure OPENAI_API_KEY to enable AI-powered insights",
        ],
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a study coach for university students. Analyze study session data and respond ONLY with valid JSON.",
        },
        {
          role: "user",
          content: `Analyze this student's study data and provide: 1) Pattern insights (best location and time of day), 2) Burnout risk assessment (low/medium/high) based on session length trends, break frequency changes, and late-night studying, 3) Three specific personalized recommendations. Format as JSON with keys: patterns, burnout_risk, burnout_signals, recommendations

Data: ${JSON.stringify(payload)}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const parsed = JSON.parse(content) as AnalysisResult;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Analyze API error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
