"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { createClient } from "@/lib/supabase";
import type { Location } from "@/lib/types";
import { Check, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";

export default function LocationsPage() {
  const supabase = createClient();
  const [locations, setLocations] = useState<Location[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) setUserEmail(user.email);

    const { data } = await supabase.from("locations").select("*").order("name");
    setLocations(data ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newName.trim()) return;

    await supabase.from("locations").insert({ user_id: user.id, name: newName.trim() });
    setNewName("");
    load();
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    await supabase.from("locations").update({ name: editName.trim() }).eq("id", id);
    setEditingId(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this location?")) return;
    await supabase.from("locations").delete().eq("id", id);
    load();
  }

  return (
    <AppLayout userEmail={userEmail}>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Locations</h1>
          <p className="mt-1 text-slate-500 text-sm">Save your favourite study spots for quick access</p>
        </div>

        {/* Add location form */}
        <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50">
              <Plus size={15} className="text-pink-500" />
            </div>
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Add Location</h2>
          </div>

          <form onSubmit={handleAdd} className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Library, Coffee Shop, Home Desk…"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300 transition-colors"
            />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-pink-500 transition-all duration-150 whitespace-nowrap"
            >
              <Plus size={14} />
              Add
            </button>
          </form>
        </div>

        {/* Locations list */}
        {locations.length === 0 ? (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-10 text-center">
            <MapPin size={24} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-1">No saved locations yet</p>
            <p className="text-xs text-slate-400">Add your favourite study spots above to select them quickly when logging a session.</p>
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <MapPin size={14} className="text-pink-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {locations.length} saved location{locations.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ul className="divide-y divide-slate-50">
              {locations.map((loc) => (
                <li key={loc.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  {editingId === loc.id ? (
                    /* Inline edit mode */
                    <div className="flex flex-1 items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-50">
                        <MapPin size={12} className="text-pink-400" />
                      </div>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(loc.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="flex-1 rounded-lg border border-pink-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300 transition-colors"
                      />
                      <button
                        onClick={() => handleSaveEdit(loc.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        title="Save"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                        title="Cancel"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    /* Normal row */
                    <>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-50">
                        <MapPin size={12} className="text-pink-400" />
                      </div>
                      <span className="flex-1 text-sm font-medium text-slate-800">{loc.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(loc.id);
                            setEditName(loc.name);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(loc.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tip */}
        <div className="mt-6 rounded-xl bg-pink-50 border border-pink-100 p-4 flex gap-3">
          <MapPin size={15} className="text-pink-400 shrink-0 mt-0.5" />
          <p className="text-xs text-pink-700 leading-relaxed">
            <span className="font-semibold">Tip:</span> Saved locations will appear as suggestions when you start a new study session, so you don't have to type them every time.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
