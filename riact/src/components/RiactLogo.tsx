interface RiactLogoProps {
  variant?: "sidebar" | "auth";
}

export default function RiactLogo({ variant = "sidebar" }: RiactLogoProps) {
  const isAuth = variant === "auth";

  return (
    <div className={`flex flex-col items-center ${isAuth ? "gap-2" : "gap-1"}`}>
      {/* RIACT text */}
      <div
        className={`font-playfair tracking-widest font-bold uppercase ${
          isAuth ? "text-5xl" : "text-2xl"
        } text-white`}
        style={{ fontFamily: "var(--font-playfair)", letterSpacing: "0.2em" }}
      >
        RIACT
      </div>

      {/* Subtitle - two lines */}
      <div
        className={`flex flex-col items-center text-white/75 uppercase tracking-widest ${
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
