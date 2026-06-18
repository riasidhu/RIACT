"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { createClient } from "@/lib/supabase";
import { toDatetimeLocal } from "@/lib/utils";
import type { Location } from "@/lib/types";
import { Clock, MapPin, Play } from "lucide-react";

export default function NewSessionPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [startTime, setStartTime] = useState(toDatetimeLocal());
  const [projectedEnd, setProjectedEnd] = useState(
    toDatetimeLocal(new Date(Date.now() + 2 * 60 * 60 * 1000))
  );
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      

      const { data } = await supabase.from("locations").select("*").order("name");
      if (data) setLocations(data);
    }
    load();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const locationName = newLocation.trim() || selectedLocation;
    if (!locationName) {
      setError("Please select or enter a location");
      setLoading(false);
      return;
    }

    let locationId: string | null = null;
    const existing = locations.find((l) => l.name === locationName);
    if (existing) {
      locationId = existing.id;
    } else if (newLocation.trim()) {
      const { data: created, error: locError } = await supabase
        .from("locations")
        .insert({ user_id: user.id, name: newLocation.trim() })
        .select()
        .single();
      if (locError) {
        setError(locError.message);
        setLoading(false);
        return;
      }
      locationId = created.id;
    }

    // Use the current time at the moment "Start Session" is pressed, not page load time
    const actualStart = new Date().toISOString();

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        location_id: locationId,
        location_name: locationName,
        start_time: actualStart,
        projected_end_time: new Date(projectedEnd).toISOString(),
      })
      .select()
      .single();

    setLoading(false);

    if (sessionError) {
      setError(sessionError.message);
      return;
    }

    router.push(`/session/${session.id}`);
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300 transition-colors";

  return (
    <AppLayout>
      <div className="max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Begin Study Session</h1>
          <p className="mt-1 text-slate-500 text-sm">Set your location and times, then start the timer</p>
        </div>

        <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6">
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Location */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin size={13} className="text-pink-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</span>
              </div>
              {locations.length > 0 && (
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setNewLocation("");
                  }}
                  className={`${inputClass} mb-2`}
                >
                  <option value="">Select saved location…</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={newLocation}
                onChange={(e) => {
                  setNewLocation(e.target.value);
                  setSelectedLocation("");
                }}
                placeholder={locations.length > 0 ? "Or type a new location…" : "e.g. Library, Coffee Shop…"}
                className={inputClass}
              />
            </div>

            {/* Projected end */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Clock size={13} className="text-slate-300" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Projected end time</span>
              </div>
              <input
                type="datetime-local"
                value={projectedEnd}
                onChange={(e) => setProjectedEnd(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-pink-500 disabled:opacity-50 transition-all duration-150 mt-2"
            >
              <Play size={14} />
              {loading ? "Starting…" : "Start Session"}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
