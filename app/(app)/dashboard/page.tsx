"use client";

import { motion } from "framer-motion";
import useSWR from "swr";
import {
  FileText,
  Users,
  Building2,
  AlertTriangle,
  Lock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { kpiData, mockFilings } from "@/lib/mock-data";
import { getReadableFilingUrl } from "@/lib/edgar/urls";
import Link from "next/link";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  accent = "cyan",
  onClick,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendLabel?: string;
  accent?: "cyan" | "amber" | "emerald" | "rose";
  onClick?: () => void;
}) {
  const accentMap = {
    cyan: { bg: "bg-cyan-400/10", text: "text-cyan-400", ring: "ring-cyan-400/20" },
    amber: { bg: "bg-amber-400/10", text: "text-amber-400", ring: "ring-amber-400/20" },
    emerald: { bg: "bg-emerald-400/10", text: "text-emerald-400", ring: "ring-emerald-400/20" },
    rose: { bg: "bg-rose-400/10", text: "text-rose-400", ring: "ring-rose-400/20" },
  };
  const a = accentMap[accent];

  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left overflow-hidden rounded-xl border border-[#1B2030] bg-[#0F1218] p-5 transition-all duration-300 hover:border-[#2A3050] hover:shadow-lg hover:shadow-cyan-400/5 ${
        onClick ? "cursor-pointer active:scale-[0.98]" : "cursor-default"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#8892A6]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[#E8ECF4]">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {trend && trendLabel && (
            <div className="mt-2 flex items-center gap-1">
              {trend === "up" ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-rose-400" />
              )}
              <span
                className={`text-xs ${
                  trend === "up" ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {trendLabel}
              </span>
            </div>
          )}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.bg} ring-1 ${a.ring}`}
        >
          <Icon className={`h-5 w-5 ${a.text}`} />
        </div>
      </div>
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-cyan-400/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </button>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30"
      : score >= 50
      ? "bg-amber-500/20 text-amber-400 ring-amber-500/30"
      : "bg-[#1B2030] text-[#8892A6] ring-[#2A3050]";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ring-1 ${color}`}
    >
      {score}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const tierColors: Record<string, string> = {
    OTCQX: "bg-emerald-500/15 text-emerald-400",
    OTCQB: "bg-cyan-500/15 text-cyan-400",
    PINK_CURRENT: "bg-rose-500/15 text-rose-400",
    PINK_LIMITED: "bg-rose-500/10 text-rose-300",
    GREY: "bg-[#1B2030] text-[#8892A6]",
  };
  return (
    <Badge
      variant="outline"
      className={`border-0 text-[10px] font-semibold uppercase ${
        tierColors[tier] || tierColors.GREY
      }`}
    >
      {tier?.replace("_", " ") || "OTCPK"}
    </Badge>
  );
}

import { IntelligenceDrawer } from "@/components/v2/IntelligenceDrawer";
import React from "react";
import { formatFormType } from "@/lib/utils";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filingId = searchParams.get("filingId");

  const { data: filingsData, isLoading: isLoadingFilings } = useSWR("/api/filings?limit=5", fetcher);
  const { data: statsData, isLoading: isLoadingStats } = useSWR("/api/stats", fetcher);

  const [selectedFiling, setSelectedFiling] = React.useState<unknown>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const filings = filingsData?.data || [];

  React.useEffect(() => {
    if (filingId) {
      // First check if we already have it in our list
      const filing = filings.find((f: any) => f.id === filingId);
      if (filing) {
        setSelectedFiling(filing);
        setIsDrawerOpen(true);
      } else {
        // If not in the list (e.g. deep link to older filing), fetch it
        fetch(`/api/filings/${filingId}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              setSelectedFiling(data);
              setIsDrawerOpen(true);
            }
          })
          .catch(err => console.error("Error fetching filing by ID:", err));
      }
    } else if (isDrawerOpen) {
      setIsDrawerOpen(false);
      setSelectedFiling(null);
    }
  }, [filingId, filings]);

  const handleFilingClick = (filing: any) => {
    if (!filing?.id) return;
    const params = new URLSearchParams(window.location.search);
    params.set("filingId", filing.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleDrawerChange = (open: boolean) => {
    if (!open && filingId) {
      const params = new URLSearchParams(window.location.search);
      params.delete("filingId");
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  };

  return (
    <div className="p-4 md:p-8">
      <IntelligenceDrawer 
        filing={selectedFiling} 
        open={isDrawerOpen} 
        onOpenChange={handleDrawerChange} 
      />

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#E8ECF4]">Dashboard</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Live Sync Active</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-[#8892A6]">
            OTC insider activity intelligence 
            <span className="ml-2 text-[10px] opacity-50">
              Last Updated: {new Date().toLocaleTimeString()}
            </span>
          </p>
        </div>
        {(isLoadingFilings || isLoadingStats) && (
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
        )}
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <KpiCard
          label="Filings Today"
          value={statsData?.filingsToday ?? kpiData.filingsToday}
          icon={FileText}
          trend="up"
          trendLabel="+23%"
          accent="cyan"
          onClick={() => {
            toast.info("Navigating to today's filings...");
            router.push("/filings?filter=today");
          }}
        />
        <KpiCard
          label="Tracked Issuers"
          value={statsData?.totalIssuers ?? kpiData.totalIssuers}
          icon={Building2}
          accent="emerald"
          onClick={() => {
            toast.info("Opening contacts...");
            router.push("/contacts");
          }}
        />
        <KpiCard
          label="Aged Debt"
          value={statsData?.agedDebtFlags ?? kpiData.agedDebtFlags}
          icon={AlertTriangle}
          accent="amber"
          onClick={() => {
            toast.info("Filtering for aged debt...");
            router.push("/filings?filter=debt");
          }}
        />
        <KpiCard
          label="144 Lots"
          value={statsData?.restrictedFlags ?? kpiData.restrictedFlags}
          icon={Lock}
          accent="rose"
          onClick={() => {
            toast.info("Filtering for restricted shares...");
            router.push("/filings?filter=restricted");
          }}
        />
      </motion.div>

      {/* Compliance Banner */}
      <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <p className="text-[10px] md:text-xs text-amber-300/80 leading-relaxed">
          <strong className="text-amber-400">Disclaimer:</strong> Data sourced
          from SEC. Verify contacts. Not investment advice.
        </p>
      </div>

      {/* Recent High-Score Filings */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#E8ECF4]">
            Recent High-Score
          </h2>
          <a
            href="/filings"
            className="flex items-center gap-1 text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300"
          >
            View all <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {filings.map((filing: any) => {
            const isNew = new Date().getTime() - new Date(filing.filedAt).getTime() < 24 * 60 * 60 * 1000;
            return (
              <motion.div
                key={filing.id}
                onClick={() => handleFilingClick(filing)}
                variants={item}
                className={`group flex items-center gap-3 md:gap-4 rounded-xl border px-3 md:px-5 py-4 transition-all duration-200 hover:bg-[#12151D] cursor-pointer ${
                  isNew 
                    ? "border-cyan-500/30 bg-cyan-500/5 shadow-[0_0_15px_-5px_rgba(34,211,238,0.1)] hover:border-cyan-400" 
                    : "border-[#1B2030] bg-[#0F1218] hover:border-[#2A3050]"
                }`}
              >
                {/* Score */}
                <div className="relative shrink-0">
                  <ScoreBadge score={filing.score} />
                </div>

                {/* Ticker */}
                <div className="w-12 md:w-16 shrink-0">
                  <span className="font-mono text-xs md:text-sm font-bold text-cyan-400">
                    {filing.Issuer?.ticker || "N/A"}
                  </span>
                </div>

                {/* Issuer & Insider */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[10px] md:text-xs font-bold text-cyan-400 uppercase tracking-tight">
                    {filing.Insider?.fullName || "UNKNOWN INSIDER"}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs md:text-sm font-medium text-[#E8ECF4]">
                      {filing.Issuer?.name}
                    </p>
                  </div>
                  {(filing.Insider?.city || filing.Insider?.state) && (
                    <p className="truncate text-[9px] text-[#8892A6] mt-0.5">
                      {filing.Insider?.city}{filing.Insider?.city && filing.Insider?.state ? ', ' : ''}{filing.Insider?.state}
                    </p>
                  )}
                </div>

                {/* Tier - Hidden on Mobile */}
                <div className="hidden sm:block">
                  <TierBadge tier={filing.Issuer?.marketTier || "OTCPK"} />
                </div>

                {/* Flags */}
                <div className="flex gap-1 shrink-0">
                  {filing.hasAgedDebt && (
                    <span className="flex h-5 md:h-6 items-center rounded bg-amber-500/15 px-1.5 text-[9px] md:text-[10px] font-semibold text-amber-400">
                      DEBT
                    </span>
                  )}
                  {filing.hasRestricted && (
                    <span className="flex h-5 md:h-6 items-center rounded bg-rose-500/15 px-1.5 text-[9px] md:text-[10px] font-semibold text-rose-400">
                      144
                    </span>
                  )}
                </div>

                {/* Form + Date - Form hidden on mobile */}
                <div className="w-16 md:w-24 text-right shrink-0">
                  <p className="hidden md:block font-mono text-xs text-[#E8ECF4]">
                    {formatFormType(filing.formType)}
                  </p>
                  <p className="flex items-center justify-end gap-1 text-[9px] md:text-[10px] text-[#8892A6]">
                    <Clock className="h-2 md:h-3 w-2 md:w-3" />
                    {new Date(filing.filedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* ADV - Hidden on Mobile */}
                <div className="hidden lg:block w-20 text-right shrink-0">
                  <p className="text-xs text-[#8892A6]">ADV</p>
                  <p className="font-mono text-xs font-medium text-[#E8ECF4]">
                    {filing.Issuer?.avgDailyVolume?.toLocaleString() || "0"}
                  </p>
                </div>
                
                <a 
                  href={getReadableFilingUrl(filing)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded hover:bg-[#1B2030] shrink-0 group/link"
                  title="View HTML Filing"
                >
                  <FileText className="h-4 w-4 text-[#2A3050] transition-colors group-hover/link:text-cyan-400" />
                </a>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
