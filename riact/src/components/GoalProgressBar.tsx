import type { GoalProgress } from "@/lib/goals";
import { formatMinutes } from "@/lib/utils";

interface GoalProgressBarProps {
  items: GoalProgress[];
}

export default function GoalProgressBars({ items }: GoalProgressBarProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-card p-6 text-muted text-sm">
        No active goals. Set one on the Goals page to track your progress.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Active Goals</h2>
      {items.map(({ goal, studiedMinutes, targetMinutes, percent }) => (
        <div key={goal.id} className="rounded-xl bg-card p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">
              {goal.target_hours}h {goal.timeframe}
              {goal.location_name ? ` · ${goal.location_name}` : ""}
            </span>
            <span className="text-muted">
              {formatMinutes(studiedMinutes)} / {formatMinutes(targetMinutes)}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
