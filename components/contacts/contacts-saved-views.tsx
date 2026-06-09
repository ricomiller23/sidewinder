import React from "react";
import { 
  Inbox, 
  Zap, 
  Clock, 
  Users, 
  Package, 
  MessageSquare, 
  Trash2, 
  Plus, 
  ChevronRight,
  Filter
} from "lucide-react";

interface SavedViewsProps {
  currentView: string;
  onViewChange: (slug: string) => void;
  views: any[];
  counts?: Record<string, number>;
}

export function ContactsSavedViews({ currentView, onViewChange, views, counts }: SavedViewsProps) {
  const mainViews = [
    { label: "Today's Queue", slug: "todays-queue", icon: Inbox, count: counts?.["todays-queue"] ?? 12 },
    { label: "New High Priority", slug: "new-high-priority", icon: Zap, count: counts?.["new-high-priority"] ?? 5 },
    { label: "Follow Up Today", slug: "follow-up-today", icon: Clock, count: counts?.["follow-up-today"] ?? 8 },
    { label: "Referred Contacts", slug: "referred-contacts", icon: Users, count: counts?.["referred-contacts"] ?? 3 },
    { label: "Possible Inventory", slug: "possible-inventory", icon: Package, count: counts?.["possible-inventory"] ?? 4 },
    { label: "No Response 7d+", slug: "no-response-7d", icon: MessageSquare, count: counts?.["no-response-7d"] ?? 15 },
    { label: "Dead Leads", slug: "dead-leads", icon: Trash2, count: counts?.["dead-leads"] ?? 42 },
    { label: "All Contacts", slug: "all-contacts", icon: Filter, count: counts?.["all-contacts"] ?? 1250 },
  ];

  return (
    <div className="w-64 shrink-0 flex flex-col gap-6 pr-6 border-r border-[#1B2030]/50 h-full overflow-y-auto pb-10">
      <div>
        <h3 className="px-3 mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8892A6]">
          Outreach Queues
        </h3>
        <div className="flex flex-col gap-1">
          {mainViews.map((view) => (
            <button
              key={view.slug}
              onClick={() => onViewChange(view.slug)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all group ${
                currentView === view.slug 
                  ? "bg-cyan-400/10 text-cyan-400" 
                  : "text-[#8892A6] hover:bg-[#1B2030] hover:text-[#E8ECF4]"
              }`}
            >
              <div className="flex items-center gap-3">
                <view.icon className={`h-4 w-4 ${currentView === view.slug ? "text-cyan-400" : "text-[#8892A6]/60 group-hover:text-[#E8ECF4]"}`} />
                <span className="text-sm font-medium">{view.label}</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                currentView === view.slug ? "bg-cyan-400/20" : "bg-[#1B2030]"
              }`}>
                {view.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between px-3 mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8892A6]">
            Custom Views
          </h3>
          <button className="p-1 hover:bg-[#1B2030] rounded-md transition-colors text-[#8892A6]">
            <Plus className="h-3 w-3" />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => onViewChange(view.slug)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all group ${
                currentView === view.slug 
                  ? "bg-cyan-400/10 text-cyan-400" 
                  : "text-[#8892A6] hover:bg-[#1B2030] hover:text-[#E8ECF4]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#8892A6]/40" />
                <span className="text-sm font-medium">{view.name}</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
          {views.length === 0 && (
            <p className="px-3 py-2 text-[10px] text-[#8892A6]/40 italic">
              No saved views yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
