export interface Location {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  location_id: string | null;
  location_name: string;
  start_time: string;
  end_time: string | null;
  projected_end_time: string | null;
  net_study_minutes: number | null;
  total_minutes: number | null;
  created_at: string;
}

export interface Break {
  id: string;
  session_id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
}

export interface Goal {
  id: string;
  user_id: string;
  location_name: string | null;
  target_hours: number;
  timeframe: "daily" | "weekly";
  is_active: boolean;
  created_at: string;
}

export interface AnalysisResult {
  patterns: string;
  burnout_risk: "low" | "medium" | "high";
  burnout_signals: string[];
  recommendations: string[];
}

export interface BurnoutCheck {
  triggered: boolean;
  signals: string[];
}

export interface ScheduleClass {
  id: string;
  user_id: string;
  course_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location: string | null;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}
