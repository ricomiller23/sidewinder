"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, FileText, Download, Building2, AlertTriangle, ArrowRight } from "lucide-react";

export function CommandCenter() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <Command 
        className="w-[500px] max-w-[90vw] overflow-hidden rounded-2xl border border-[#1B2030] bg-[#0F1218] shadow-2xl"
        label="Global Command Menu"
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-[#1B2030] px-4">
          <Search className="h-4 w-4 text-[#8892A6]" />
          <Command.Input 
            autoFocus
            className="w-full bg-transparent p-4 text-sm text-[#E8ECF4] placeholder:text-[#8892A6] focus:outline-none" 
            placeholder="Type a command or search..." 
          />
        </div>
        <Command.List className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
          <Command.Empty className="py-6 text-center text-sm text-[#8892A6]">
            No results found.
          </Command.Empty>

          <Command.Group heading={<span className="text-[10px] font-bold uppercase tracking-widest text-[#8892A6] px-2 py-1">Quick Actions</span>}>
            <Command.Item 
              onSelect={() => { window.location.href = '/filings?q=debt'; setOpen(false); }}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#E8ECF4] hover:bg-cyan-500/10 hover:text-cyan-400 aria-selected:bg-cyan-500/10 aria-selected:text-cyan-400"
            >
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Find Aged Debt Filings
            </Command.Item>
            <Command.Item 
              onSelect={() => { alert("Exporting today's filings..."); setOpen(false); }}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#E8ECF4] hover:bg-cyan-500/10 hover:text-cyan-400 aria-selected:bg-cyan-500/10 aria-selected:text-cyan-400"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              Export Today's Intelligence
            </Command.Item>
          </Command.Group>

          <Command.Group heading={<span className="text-[10px] font-bold uppercase tracking-widest text-[#8892A6] px-2 py-1">Navigation</span>}>
            <Command.Item 
              onSelect={() => { window.location.href = '/dashboard'; setOpen(false); }}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#E8ECF4] hover:bg-[#1B2030] aria-selected:bg-[#1B2030]"
            >
              <Building2 className="h-4 w-4 text-[#8892A6]" />
              Dashboard
            </Command.Item>
            <Command.Item 
              onSelect={() => { window.location.href = '/filings'; setOpen(false); }}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#E8ECF4] hover:bg-[#1B2030] aria-selected:bg-[#1B2030]"
            >
              <FileText className="h-4 w-4 text-[#8892A6]" />
              All Filings
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
