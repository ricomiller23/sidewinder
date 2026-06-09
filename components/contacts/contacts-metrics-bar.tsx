import React from "react";
import { Users, Zap, Clock, MessageSquare, Package, BarChart3 } from "lucide-react";

interface MetricsProps {
  metrics: {
    contacts_in_queue: number;
    high_priority_contacts: number;
    follow_ups_due_today: number;
    positive_replies_this_week: number;
    possible_inventory_count: number;
    avg_days_since_last_touch: number | null;
  };
}

export function ContactsMetricsBar({ metrics }: MetricsProps) {
  const stats = [
    { label: "Queue Size", value: metrics.contacts_in_queue, icon: Users, color: "text-cyan-400" },
    { label: "High Priority", value: metrics.high_priority_contacts, icon: Zap, color: "text-amber-400" },
    { label: "Follow Ups Today", value: metrics.follow_ups_due_today, icon: Clock, color: "text-rose-400" },
    { label: "Positive Replies", value: metrics.positive_replies_this_week, icon: MessageSquare, color: "text-emerald-400" },
    { label: "Possible Inventory", value: metrics.possible_inventory_count, icon: Package, color: "text-purple-400" },
    { label: "Avg Touch (Days)", value: metrics.avg_days_since_last_touch?.toFixed(1) || "N/A", icon: BarChart3, color: "text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 sticky top-0 z-10 bg-[#07080B]/80 backdrop-blur-md py-2">
      {stats.map((stat, i) => (
        <div key={i} className="flex flex-col rounded-xl border border-[#1B2030] bg-[#0F1218] p-4 transition-all hover:border-[#2A3050]">
          <div className="flex items-center justify-between mb-2">
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8892A6]">
              {stat.label}
            </span>
          </div>
          <div className="text-xl font-black text-[#E8ECF4]">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
