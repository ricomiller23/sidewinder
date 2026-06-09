import React from "react";
import { Search, Filter, ArrowUpDown, Download, Trash2, UserPlus, Mail, PhoneCall } from "lucide-react";

interface ToolbarProps {
  onSearch: (q: string) => void;
  onFilterChange: (filters: unknown) => void;
  selectedCount: number;
  onBulkAction: (action: string) => void;
}

export function ContactsToolbar({ onSearch, onFilterChange, selectedCount, onBulkAction }: ToolbarProps) {
  return (
    <div className="flex flex-col gap-4 mb-6 sticky top-[100px] z-10 bg-[#07080B]/80 backdrop-blur-md py-2 border-b border-[#1B2030]/50 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="flex flex-1 min-w-[300px] items-center gap-2 rounded-lg border border-[#1B2030] bg-[#0F1218] px-3 py-2 focus-within:border-cyan-400/50 transition-all">
          <Search className="h-4 w-4 text-[#8892A6]" />
          <input
            type="text"
            placeholder="Search by name, ticker, or thesis..."
            onChange={(e) => onSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#E8ECF4] outline-none placeholder-[#8892A6]/50"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-[#1B2030] bg-[#0F1218] px-3 py-2 text-xs font-bold text-[#E8ECF4] hover:bg-[#1B2030] transition-all">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-[#1B2030] bg-[#0F1218] px-3 py-2 text-xs font-bold text-[#E8ECF4] hover:bg-[#1B2030] transition-all">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-[#1B2030] bg-[#0F1218] px-3 py-2 text-xs font-bold text-[#E8ECF4] hover:bg-[#1B2030] transition-all">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Bulk Actions (Conditional) */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-cyan-400/10 border border-cyan-400/20 px-4 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-xs font-bold text-cyan-400">
            {selectedCount} contacts selected
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onBulkAction('assign')}
              className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-400 hover:bg-cyan-400/10 rounded"
            >
              <UserPlus className="h-3 w-3" /> Assign
            </button>
            <button 
              onClick={() => onBulkAction('email')}
              className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-400 hover:bg-cyan-400/10 rounded"
            >
              <Mail className="h-3 w-3" /> Email
            </button>
            <button 
              onClick={() => onBulkAction('status')}
              className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-400 hover:bg-cyan-400/10 rounded"
            >
              <Trash2 className="h-3 w-3" /> Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
