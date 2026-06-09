"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Users, AlertTriangle,
  Settings, Search, Shield, Scale, Activity,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/filings", label: "Filings", icon: FileText },
  { href: "/signals", label: "Signals", icon: AlertTriangle },
  { href: "/3a10", label: "3(a)(10)", icon: Scale },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[260px] flex-col border-r border-[#1B2030] bg-[#0A0C10] md:flex">
      {/* Logo */}
      <Link href="/dashboard" className="flex h-16 items-center gap-3 border-b border-[#1B2030] px-6 hover:bg-[#1B2030]/30 transition-colors">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
          <Activity className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-[#E8ECF4]">SIDE</span>
          <span className="text-sm font-bold tracking-tight text-amber-400">WINDER</span>
        </div>
      </Link>

      {/* Search */}
      <div className="px-4 py-3">
        <button className="flex w-full items-center gap-2 rounded-lg border border-[#1B2030] bg-[#0F1218] px-3 py-2 text-sm text-[#8892A6] transition-colors hover:border-[#2A3050] hover:text-[#E8ECF4] cursor-pointer">
          <Search className="h-4 w-4" />
          <span>Search filings…</span>
          <kbd className="ml-auto rounded border border-[#1B2030] bg-[#07080B] px-1.5 py-0.5 text-[10px] font-mono text-[#8892A6]">⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-amber-400/10 text-amber-400 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.15)]"
                  : "text-[#8892A6] hover:bg-[#1B2030]/50 hover:text-[#E8ECF4]"
              }`}
            >
              <item.icon className={`h-4 w-4 transition-colors ${isActive ? "text-amber-400" : "text-[#8892A6] group-hover:text-[#E8ECF4]"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Pipeline Status */}
      <div className="border-t border-[#1B2030] p-4">
        <div className="rounded-lg border border-[#1B2030] bg-[#0F1218] p-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-[#8892A6]">Pipeline Status</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs text-emerald-400">Sidewinder Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
