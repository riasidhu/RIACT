"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Home,
  LayoutDashboard,
  Lightbulb,
  Target,
  MapPin,
  BookOpen,
  Brain,
  CalendarDays,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import RiactLogo from "@/components/RiactLogo";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/coach", label: "AI Coach", icon: Brain },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/schedule", label: "Class Schedule", icon: CalendarDays },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/resources", label: "Resources & FAQ", icon: BookOpen },
];

const GRADIENT = "linear-gradient(160deg, #ff6eb4 0%, #ec4899 40%, #c026d3 100%)";

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 px-3 space-y-0.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/home" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
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
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setUserEmail(session.user.email);
    });
  }, [supabase]);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  const firstName = userEmail ? userEmail.split("@")[0] : "…";

  const userSection = (
    <>
      <div className="mx-4 h-px bg-white/20 mb-3" />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25">
            <span className="text-xs font-bold text-white uppercase">{firstName.charAt(0)}</span>
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
    </>
  );

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div
        className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between px-4 md:hidden"
        style={{ background: GRADIENT }}
      >
        <button onClick={() => setMobileOpen(true)} className="text-white p-1">
          <Menu size={22} />
        </button>
        <Link href="/home">
          <RiactLogo variant="sidebar" />
        </Link>
        {/* spacer to balance the hamburger */}
        <div className="w-8" />
      </div>

      {/* ── Mobile slide-out drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside
            className="absolute left-0 top-0 flex h-full w-[260px] flex-col border-r border-pink-200/40"
            style={{ background: GRADIENT }}
          >
            <div className="flex items-center justify-between p-4 pb-2">
              <Link href="/home" onClick={() => setMobileOpen(false)}>
                <RiactLogo variant="sidebar" />
              </Link>
              <button onClick={() => setMobileOpen(false)} className="text-white/70 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <div className="mx-4 h-px bg-white/20 mb-3" />
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            {userSection}
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-screen w-[260px] flex-col border-r border-pink-200/40"
        style={{ background: GRADIENT }}
      >
        <div className="p-4 pb-2 flex justify-center">
          <Link href="/home">
            <RiactLogo variant="sidebar" />
          </Link>
        </div>
        <div className="mx-4 h-px bg-white/20 mb-3" />
        <NavLinks pathname={pathname} />
        {userSection}
      </aside>
    </>
  );
}
