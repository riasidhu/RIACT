import { ButtonHTMLAttributes } from "react";

interface PinkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

export default function PinkButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: PinkButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-lg",
  };
  const variants = {
    primary: "bg-primary hover:bg-pink-600 text-white",
    secondary: "bg-card hover:bg-slate-600 text-foreground border border-slate-600",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
