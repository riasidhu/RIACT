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
    const { user_id } = await request.json();

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
    const [{ data: sessions }, { data: goals }] = await Promise.all([
      supabase.from("sessions").select("*").eq("user_id", user_id).gte("start_time", since).not("end_time", "is", null),
      supabase.from("goals").select("*").eq("user_id", user_id).eq("is_active", true),
    ]);

    const context = {
      sessions: (sessions ?? []).map((s) => ({
        location: s.location_name,
        day_of_week: new Date(s.start_time).toLocaleDateString("en-US", { weekday: "long" }),
        net_minutes: s.net_study_minutes,
      })),
      goals: (goals ?? []).map((g) => `${g.target_hours}h ${g.timeframe}${g.location_name ? ` at ${g.location_name}` : ""}`),
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 350,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `Based on this student's study history and goals, generate a realistic study plan for the coming week. Return ONLY valid JSON with this exact shape:
{
  "summary": "one sentence overview of the plan",
  "days": [
    { "day": "Monday", "hours": 2.0, "location": "Library", "focus": "short tip for this day" },
    ...all 7 days...
  ]
}
Use 0 hours for rest days. Base it on their patterns — don't just spread hours evenly.

Data: ${JSON.stringify(context)}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "No response" }, { status: 500 });

    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Weekly plan error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
