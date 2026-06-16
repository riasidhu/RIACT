"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Home,
  LayoutDashboard,
  Lightbulb,
  Target,
  MapPin,
  BookOpen,
  LogOut,
} from "lucide-react";
import RiactLogo from "@/components/RiactLogo";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/resources", label: "Resources & FAQ", icon: BookOpen },
];

interface SidebarProps {
  userEmail: string;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  const firstName = userEmail.split("@")[0];

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[260px] flex-col border-r border-pink-200/40" style={{background: "linear-gradient(160deg, #ff6eb4 0%, #ec4899 40%, #c026d3 100%)"}}>
      {/* Logo */}
      <div className="p-4 pb-2 flex justify-center">
        <Link href="/">
          <RiactLogo variant="sidebar" />
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/20 mb-3" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
                active
                  ? "bg-white/25 text-white font-semibold shadow-sm"
                  : "text-pink-100 hover:bg-white/15 hover:text-white"
              }`}
            >
              <Icon size={16} className={active ? "text-white" : "text-pink-200"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="mx-4 h-px bg-white/20 mb-3" />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25">
            <span className="text-xs font-bold text-white uppercase">
              {firstName.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate capitalize">{firstName}</p>
            <p className="text-xs text-pink-100/80 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-pink-100 hover:bg-white/15 hover:text-white transition-colors"
        >
          <LogOut size={14} />
          Log out
        </button>
      </div>
    </aside>
  );
}
