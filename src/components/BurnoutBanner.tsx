interface BurnoutBannerProps {
  signals: string[];
}

export default function BurnoutBanner({ signals }: BurnoutBannerProps) {
  if (signals.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div>
          <h3 className="font-semibold text-amber-800">Burnout Warning</h3>
          <p className="mt-1 text-sm text-amber-700">
            We detected signals that may indicate study fatigue. Consider taking a break
            and reviewing your schedule.
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-700">
            {signals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <a
            href="https://www.nami.org/help"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-amber-800 underline hover:text-amber-900"
          >
            Mental health resources →
          </a>
        </div>
      </div>
    </div>
  );
}
