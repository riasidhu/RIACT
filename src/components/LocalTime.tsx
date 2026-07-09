"use client";

import { format, parseISO } from "date-fns";

export default function LocalTime({ iso, fallback = "—" }: { iso: string | null | undefined; fallback?: string }) {
  if (!iso) return <>{fallback}</>;
  return <>{format(parseISO(iso), "h:mm a")}</>;
}
