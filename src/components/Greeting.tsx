"use client";

import { useEffect, useState } from "react";
import { greetingForHour, hourInTimeZone } from "@/lib/utils";

// Renders the time-based greeting. The server passes an `initial` value (computed
// with the saved timezone, or the server clock if none is set) so hydration
// matches; on mount we recompute using the saved timezone, or — when none is
// set — the browser's device timezone, correcting a wrong server-side hour.
export default function Greeting({
  name,
  timezone,
  initial,
}: {
  name: string;
  timezone?: string;
  initial: string;
}) {
  const [greeting, setGreeting] = useState(initial);

  useEffect(() => {
    setGreeting(greetingForHour(hourInTimeZone(timezone)));
  }, [timezone]);

  return (
    <>
      {greeting}, {name}
    </>
  );
}
