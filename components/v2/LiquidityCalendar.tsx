"use client";

import React from "react";
import { Calendar, Lock, Unlock, AlertTriangle } from "lucide-react";

export function LiquidityCalendar({ 
  eligibilityDate, 
  shares,
  tier
}: { 
  eligibilityDate: string, 
  shares: number,
  tier: string
}) {
  const isEligible = new Date(eligibilityDate) <= new Date();
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
          isEligible ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" : "bg-rose-500/10 text-rose-400 ring-rose-500/20"
        }`}>
          {isEligible ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8892A6]">
            {isEligible ? "Currently Eligible" : "Rule 144 Lockup"}
          </p>
          <p className={`text-lg font-bold ${isEligible ? "text-emerald-400" : "text-rose-400"}`}>
            {eligibilityDate}
          </p>
        </div>
      </div>
      
      <div className="rounded-xl border border-[#1B2030] bg-[#07080B] p-4">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="text-[#8892A6]">Restricted Volume</span>
          <span className="font-mono font-bold text-[#E8ECF4]">{shares.toLocaleString()} shs</span>
        </div>
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="text-[#8892A6]">Holding Period</span>
          <span className="font-mono font-bold text-[#E8ECF4]">
            {(tier === 'PINK_LIMITED' || tier === 'GREY') ? '12 Months' : '6 Months'}
          </span>
        </div>
        
        {!isEligible && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-400/90">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <p>
              Potential sell-side pressure expected around this date. Monitor volume closely.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
