"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home,
  FileText, 
  Users, 
  AlertTriangle, 
  Settings,
  Scale
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/filings", label: "Filings", icon: FileText },
  { href: "/signals", label: "Signals", icon: AlertTriangle },
  { href: "/3a10", label: "3a10", icon: Scale },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-[#0A0C10]/80 backdrop-blur-xl border-t border-[#1B2030]" />
      
      <div className="relative flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                isActive ? "text-cyan-400" : "text-[#8892A6]"
              }`}
            >
              <div className={`relative flex items-center justify-center p-1 rounded-xl transition-all duration-300 ${
                isActive ? "bg-cyan-400/10 scale-110" : ""
              }`}>
                <item.icon className="h-5 w-5" />
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold tracking-tighter uppercase">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* iPhone Home Indicator Safety Area */}
      <div className="h-[env(safe-area-inset-bottom)] bg-[#0A0C10]/80 backdrop-blur-xl" />
    </nav>
  );
}
