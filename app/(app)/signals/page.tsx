"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AlertTriangle, Lock, Building2, Clock, ArrowUpRight, Search, Loader2, FileText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mockFilings, mockAgedDebts, mockRestrictedLots } from "@/lib/mock-data";
import { IntelligenceDrawer } from "@/components/v2/IntelligenceDrawer";
import React from "react";
import { formatFormType } from "@/lib/utils";
import { getReadableFilingUrl } from "@/lib/edgar/urls";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getFilingExplanation(filing: any, activeTab: "debt" | "restricted" | "3a10"): string {
  if (activeTab === "debt") {
    if (filing.AgedDebt && filing.AgedDebt.length > 0 && filing.AgedDebt[0].rationale) {
      return filing.AgedDebt[0].rationale;
    }
    const ticker = filing.issuer?.ticker || filing.Issuer?.ticker || "";
    const mock = mockAgedDebts.find(d => d.issuerTicker === ticker);
    if (mock) return mock.rationale;
    const companyName = filing.issuer?.name || filing.Issuer?.name || "the company";
    const formName = formatFormType(filing.formType);
    return `Potential aged or convertible debt exposure detected in ${formName} submitted by ${companyName}. This flag indicates outstanding debt past its maturity or subject to conversion terms.`;
  }
  
  if (activeTab === "restricted") {
    if (filing.RestrictedShareLot && filing.RestrictedShareLot.length > 0 && filing.RestrictedShareLot[0].rationale) {
      return filing.RestrictedShareLot[0].rationale;
    }
    const ticker = filing.issuer?.ticker || filing.Issuer?.ticker || "";
    const mock = mockRestrictedLots.find(r => r.issuerTicker === ticker);
    if (mock) return mock.rationale;
    const companyName = filing.issuer?.name || filing.Issuer?.name || "the company";
    const formName = formatFormType(filing.formType);
    const insiderName = filing.insider?.fullName || filing.Insider?.fullName || "an insider";
    return `Rule 144 restricted stock lot identified for ${insiderName} in ${companyName}'s ${formName} filing. Sourced from a private placement or affiliate acquisition subject to holding periods.`;
  }
  
  // 3a10 Exemption
  if (filing.rationale) return filing.rationale;
  if (filing.notes) return filing.notes;
  const companyName = filing.issuer?.name || filing.Issuer?.name || "the company";
  const formName = formatFormType(filing.formType);
  return `Section 3(a)(10) registration exemption detected in ${formName} submitted by ${companyName}. This indicates securities issued to settle outstanding claims or debt under court approval after a fairness hearing.`;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "URGENT"
      ? "bg-rose-500/20 text-rose-400"
      : status === "ACTIVE"
      ? "bg-emerald-500/20 text-emerald-400"
      : "bg-[#1B2030] text-[#8892A6]";
  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${color}`}>
      {status}
    </span>
  );
}

const agedDebtMock = mockFilings
  .filter((f) => f.hasAgedDebt)
  .map((f) => ({ ...f, type: "AGED DEBT" }));

const restrictedMock = mockFilings
  .filter((f) => f.hasRestricted)
  .map((f) => ({ ...f, type: "RESTRICTED" }));

export default function SignalsPage() {
  const [activeTab, setActiveTab] = useState<"debt" | "restricted" | "3a10">("debt");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filingId = searchParams.get("filingId");

  const { data, isLoading } = useSWR("/api/signals", fetcher);
  const [selectedFiling, setSelectedFiling] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Memoize allFilings to prevent infinite loops in useEffect
  const allFilings = React.useMemo(() => [
    ...agedDebtMock, 
    ...restrictedMock, 
    ...(data?.agedDebt || []), 
    ...(data?.restricted || []),
    ...(data?.s3a10 || [])
  ], [data]);

  useEffect(() => {
    if (!filingId) {
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
        setSelectedFiling(null);
      }
      return;
    }

    const filing = allFilings.find((f: any) => f.id === filingId);
    if (filing) {
      // Only update if it's a different filing
      if (selectedFiling?.id !== filing.id) {
        setSelectedFiling(filing);
        setIsDrawerOpen(true);
      }
    } else {
      // Fetch if not in current list
      fetch(`/api/filings/${filingId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && selectedFiling?.id !== data.id) {
            setSelectedFiling(data);
            setIsDrawerOpen(true);
          }
        })
        .catch(err => console.error("Error fetching filing by ID:", err));
    }
  }, [filingId, allFilings, selectedFiling?.id, isDrawerOpen]);

  const handleAnalyze = (filing: any) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filingId", filing.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleDrawerChange = (open: boolean) => {
    if (!open && filingId) {
      router.back();
    }
  };

  const filings =
    activeTab === "debt"
      ? data?.agedDebt?.length > 0
        ? data.agedDebt
        : agedDebtMock
      : activeTab === "restricted"
      ? data?.restricted?.length > 0
        ? data.restricted
        : restrictedMock
      : data?.s3a10 || [];

  return (
    <div className="p-8">
      <IntelligenceDrawer 
        filing={selectedFiling} 
        open={isDrawerOpen} 
        onOpenChange={handleDrawerChange} 
      />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#E8ECF4]">Intelligence Signals</h1>
          <p className="mt-1 text-sm text-[#8892A6]">
            High-priority forensic flags detected in recent filings
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#1B2030] bg-[#0F1218] p-1">
          <button
            onClick={() => setActiveTab("debt")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "debt"
                ? "bg-amber-400 text-[#07080B]"
                : "text-[#8892A6] hover:text-[#E8ECF4]"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Aged Debt
          </button>
          <button
            onClick={() => setActiveTab("restricted")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "restricted"
                ? "bg-rose-400 text-[#07080B]"
                : "text-[#8892A6] hover:text-[#E8ECF4]"
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            Restricted Shares
          </button>
          <button
            onClick={() => setActiveTab("3a10")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "3a10"
                ? "bg-cyan-400 text-[#07080B]"
                : "text-[#8892A6] hover:text-[#E8ECF4]"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            3(a)(10) Exemption
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="grid gap-4"
        >
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {filings.map((filing: any) => (
              <motion.div
                key={filing.id}
                variants={item}
                className="group relative flex flex-col gap-4 rounded-xl border border-[#1B2030] bg-[#0F1218] p-6 transition-all hover:border-[#2A3050]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${
                        activeTab === "debt"
                          ? "bg-amber-400/10 text-amber-400 ring-amber-400/20"
                          : "bg-rose-400/10 text-rose-400 ring-rose-400/20"
                      }`}
                    >
                      {activeTab === "debt" ? (
                        <AlertTriangle className="h-6 w-6" />
                      ) : activeTab === "restricted" ? (
                        <Lock className="h-6 w-6" />
                      ) : (
                        <ShieldCheck className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-mono text-lg font-bold text-cyan-400">
                          {filing.issuer?.ticker || filing.Issuer?.ticker || "N/A"}
                        </h3>
                        <StatusBadge status={filing.score > 80 ? "URGENT" : "ACTIVE"} />
                      </div>
                      <p className="mt-1 text-sm font-medium text-[#E8ECF4]">
                        {filing.issuer?.name || filing.Issuer?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8892A6]">
                      Signal Strength
                    </p>
                    <p
                      className={`text-2xl font-black ${
                        filing.score > 80 ? "text-rose-400" : "text-amber-400"
                      }`}
                    >
                      {filing.score}%
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 border-t border-[#1B2030] pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8892A6]">
                      Detection
                    </p>
                    <p className="mt-1 text-sm text-[#E8ECF4]">
                      {activeTab === "debt"
                        ? "Aged/Convertible Debt Note"
                        : activeTab === "restricted"
                        ? "Rule 144 Restricted Block"
                        : "Section 3(a)(10) Registration Exemption"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8892A6]">
                      Insider
                    </p>
                    <p className="mt-1 text-sm text-[#E8ECF4]">
                      {filing.insider?.fullName || filing.insider?.name || filing.Insider?.fullName || filing.Insider?.name || "Multiple insiders"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8892A6]">
                      Market ADV
                    </p>
                    <p className="mt-1 text-sm text-[#E8ECF4]">
                      {filing.issuer?.avgDailyVolume?.toLocaleString() || filing.Issuer?.avgDailyVolume?.toLocaleString() || "0"} shares
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-xs text-[#8892A6]">
                    <Clock className="h-3.5 w-3.5" />
                    Detected in {formatFormType(filing.formType)} filed on{" "}
                    {new Date(filing.filedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-4">
                    <a 
                      href={getReadableFilingUrl(filing)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-[#8892A6] hover:text-cyan-400"
                      title="View clean SEC HTML filing"
                    >
                      View HTML <FileText className="h-3.5 w-3.5" />
                    </a>
                    <button 
                      onClick={() => handleAnalyze(filing)}
                      className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline"
                    >
                      Analyze Filing <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-[#07080B]/40 p-3.5 border border-[#1B2030]/50">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${
                    activeTab === "debt"
                      ? "text-amber-400"
                      : activeTab === "restricted"
                      ? "text-rose-400"
                      : "text-cyan-400"
                  }`}>
                    Analysis & Rationale
                  </p>
                  <p className="mt-1 text-xs text-[#8892A6] leading-relaxed">
                    {getFilingExplanation(filing, activeTab)}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
