interface RiactLogoProps {
  variant?: "sidebar" | "auth" | "landing";
}

export default function RiactLogo({ variant = "sidebar" }: RiactLogoProps) {
  const isAuth = variant === "auth";
  const isLanding = variant === "landing";

  const textColor = isLanding ? "text-slate-900" : "text-white";
  const subColor = isLanding ? "text-slate-400" : "text-white/75";

  return (
    <div className={`flex flex-col items-center ${isAuth ? "gap-2" : "gap-1"}`}>
      {/* RIACT text */}
      <div
        className={`font-playfair tracking-widest font-bold uppercase ${
          isAuth ? "text-5xl" : "text-2xl"
        } ${textColor}`}
        style={{ fontFamily: "var(--font-playfair)", letterSpacing: "0.2em" }}
      >
        RIACT
      </div>

      {/* Subtitle - two lines */}
      <div
        className={`flex flex-col items-center ${subColor} uppercase tracking-widest ${
          isAuth ? "text-[10px] gap-0.5" : "text-[8px] gap-0.5"
        }`}
        style={{ letterSpacing: "0.18em" }}
      >
        <span>Record · Insight · Analyze</span>
        <span>Coach · Track</span>
      </div>
    </div>
  );
}
