"use client";

import { motion } from "framer-motion";
import useSWRInfinite from "swr/infinite";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  ArrowUpDown,
  Download,
  Filter,
  Search,
  Loader2,
  FileText,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { IntelligenceDrawer } from "@/components/v2/IntelligenceDrawer";
import React from "react";
import { formatFormType } from "@/lib/utils";
import { getReadableFilingUrl } from "@/lib/edgar/urls";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

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

import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function FilingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeForm, setActiveForm] = React.useState<string | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);
  const [activeCik, setActiveCik] = React.useState<string | null>(null);
  const [activeFilingId, setActiveFilingId] = React.useState<string | null>(null);

  // Sync state with URL search params on mount and navigation (back/forward)
  React.useEffect(() => {
    setActiveForm(searchParams.get("form"));
    setActiveFilter(searchParams.get("filter"));
    setActiveCik(searchParams.get("cik"));
    setActiveFilingId(searchParams.get("filingId"));
  }, [searchParams]);
  
  // Filter filings by CIK if provided (Standardized comparison)
  const normalizeCik = (c: string | null) => c?.replace(/^0+/, '') || '';
  const targetCik = activeCik ? normalizeCik(activeCik) : null;

  const [selectedFiling, setSelectedFiling] = React.useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.nextCursor) return null;
    let base = `/api/filings?limit=20`;
    if (targetCik) base += `&cik=${targetCik}`;
    if (activeFilter) base += `&filter=${activeFilter}`;
    if (activeForm) base += `&form=${activeForm}`;
    if (pageIndex === 0) return base;
    return `${base}&cursor=${previousPageData.nextCursor}`;
  };

  const { data, error, isLoading, size, setSize, isValidating } = useSWRInfinite(getKey, fetcher);

  const setFormFilter = (newForm: string | null, newFilter: string | null) => {
    setActiveForm(newForm);
    setActiveFilter(newFilter);
    setSize(1);

    const params = new URLSearchParams(window.location.search);
    if (newForm) {
      params.set("form", newForm);
    } else {
      params.delete("form");
    }
    if (newFilter) {
      params.set("filter", newFilter);
    } else {
      params.delete("filter");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const allFilings = data ? data.flatMap(page => page.data) : [];
  const hasMore = data && data[data.length - 1]?.nextCursor !== null;
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const filings = targetCik 
    ? allFilings.filter((f: any) => 
        normalizeCik(f.Insider?.cik) === targetCik || 
        normalizeCik(f.Issuer?.cik) === targetCik
      )
    : allFilings;

  // Sync drawer state with URL
  React.useEffect(() => {
    if (activeFilingId) {
      if (selectedFiling?.id === activeFilingId) return;
      
      const filing = allFilings.find((f: any) => f.id === activeFilingId);
      if (filing) {
        setSelectedFiling(filing);
        setIsDrawerOpen(true);
      } else {
        // Only fetch if we don't already have it loading or set
        fetch(`/api/filings/${activeFilingId}`)
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
  }, [activeFilingId, allFilings]);

  const handleFilingClick = (filing: any) => {
    if (!filing?.id) return;
    setActiveFilingId(filing.id);
    const params = new URLSearchParams(window.location.search);
    params.set("filingId", filing.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isDailySyncing, setIsDailySyncing] = React.useState(false);

  const handleSyncDaily = async () => {
    setIsDailySyncing(true);
    try {
      const res = await fetch('/api/cron/daily-filings');
      if (res.ok) {
        toast.success("Daily SEC sync triggered. New filings should appear in 1-2 minutes.");
        // Give it some time then refresh
        setTimeout(() => setSize(1), 5000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(`Sync failed: ${errorData.error || "Unknown error"}`);
      }
    } catch (e) {
      toast.error("Error triggering daily sync.");
    } finally {
      setIsDailySyncing(false);
    }
  };

  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortByNames, setSortByNames] = React.useState(false);

  const filteredFilings = React.useMemo(() => {
    if (!searchQuery.trim()) return filings;
    const query = searchQuery.toLowerCase();
    return filings.filter((f: any) => {
      const tickerMatch = f.Issuer?.ticker?.toLowerCase().includes(query);
      const nameMatch = f.Issuer?.name?.toLowerCase().includes(query);
      const formMatch = f.formType?.toLowerCase().includes(query);
      const insiderMatch = f.Insider?.fullName?.toLowerCase().includes(query);
      return tickerMatch || nameMatch || formMatch || insiderMatch;
    });
  }, [filings, searchQuery]);

  const sortedFilings = React.useMemo(() => {
    let result = [...filteredFilings];
    if (sortByNames) {
      result.sort((a: any, b: any) => {
        const nameA = a.Insider?.fullName || "";
        const nameB = b.Insider?.fullName || "";
        const companyA = a.Issuer?.name || "";
        const companyB = b.Issuer?.name || "";

        const hasInsiderA = !!a.Insider?.fullName;
        const hasInsiderB = !!b.Insider?.fullName;

        if (hasInsiderA && !hasInsiderB) return -1;
        if (!hasInsiderA && hasInsiderB) return 1;

        if (hasInsiderA && hasInsiderB) {
          const compareNames = nameA.localeCompare(nameB);
          if (compareNames !== 0) return compareNames;
          return companyA.localeCompare(companyB);
        } else {
          return companyA.localeCompare(companyB);
        }
      });
    }
    return result;
  }, [filteredFilings, sortByNames]);

  const handleSyncHistory = async () => {
    if (!targetCik) return;
    setIsSyncing(true);
    try {
      await fetch('/api/filings/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cik: targetCik })
      });
      // Invalidate SWR cache to reload data
      setSize(1);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDrawerChange = (open: boolean) => {
    if (!open && activeFilingId) {
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

      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#E8ECF4]">Filings</h1>
            {(activeFilter || activeForm) && (
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                {activeFilter === 'today' ? 'Today' : 
                 activeFilter === 'debt' ? 'Aged Debt' : 
                 activeFilter === 'restricted' ? '144 Lots' : 
                 activeFilter === '3a10' ? '3(a)(10)' : 
                 activeForm === 'FORM_3' ? 'Form 3' :
                 activeForm === 'FORM_4' ? 'Form 4' :
                 activeForm === 'S1' ? 'Form S-1' :
                 activeForm === '13D' ? 'Form 13D' :
                 activeFilter || activeForm}
                <button 
                  onClick={() => {
                    setActiveForm(null);
                    setActiveFilter(null);
                    setSize(1);
                    const params = new URLSearchParams(window.location.search);
                    params.delete("filter");
                    params.delete("form");
                    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
                  }}
                  className="ml-2 hover:text-white"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-[#8892A6]">
            SEC Form 3, 4, S-1, 13D, 13G & 3(a)(10)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(isLoading || isSyncing) && <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />}
          <button 
            onClick={handleSyncDaily}
            disabled={isDailySyncing}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-[#07080B] transition-colors hover:bg-emerald-400 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            <RefreshCw className={`h-3 w-3 ${isDailySyncing ? 'animate-spin' : ''}`} />
            {isDailySyncing ? "Syncing..." : "Sync SEC"}
          </button>
          {targetCik && (
            <button 
              onClick={handleSyncHistory}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-[#07080B] transition-colors hover:bg-cyan-300 disabled:opacity-50"
            >
              {isSyncing ? "Syncing History..." : "Sync History"}
            </button>
          )}
          <button 
            onClick={() => setSortByNames(!sortByNames)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              sortByNames 
                ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-400 shadow-lg shadow-cyan-400/5" 
                : "border-[#1B2030] bg-[#0F1218] text-[#8892A6] hover:text-[#E8ECF4] hover:bg-[#12151D]"
            }`}
          >
            <ArrowUpDown className="h-3 w-3" />
            {sortByNames ? "Sorted: Human Names" : "Sort: Human Names"}
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-[#1B2030] bg-[#0F1218] px-3 py-2 text-xs font-medium text-[#8892A6]">
            <Filter className="h-3 w-3" />
            Filters
          </button>
        </div>
      </div>

      {/* Tab Filter Button Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-[#1B2030]/60 bg-[#0F1218]/40 p-1.5 w-fit">
        <button
          onClick={() => setFormFilter(null, null)}
          className={`rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            !activeForm && !activeFilter
              ? "bg-cyan-400 text-[#07080B] shadow-md shadow-cyan-400/10"
              : "text-[#8892A6] hover:text-[#E8ECF4] hover:bg-[#12151D]"
          }`}
        >
          All Filings
        </button>
        <button
          onClick={() => setFormFilter("FORM_3", null)}
          className={`rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            activeForm === "FORM_3"
              ? "bg-cyan-400 text-[#07080B] shadow-md shadow-cyan-400/10"
              : "text-[#8892A6] hover:text-[#E8ECF4] hover:bg-[#12151D]"
          }`}
        >
          Form 3
        </button>
        <button
          onClick={() => setFormFilter("FORM_4", null)}
          className={`rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            activeForm === "FORM_4"
              ? "bg-cyan-400 text-[#07080B] shadow-md shadow-cyan-400/10"
              : "text-[#8892A6] hover:text-[#E8ECF4] hover:bg-[#12151D]"
          }`}
        >
          Form 4
        </button>
        <button
          onClick={() => setFormFilter("S1", null)}
          className={`rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            activeForm === "S1"
              ? "bg-cyan-400 text-[#07080B] shadow-md shadow-cyan-400/10"
              : "text-[#8892A6] hover:text-[#E8ECF4] hover:bg-[#12151D]"
          }`}
        >
          Form S-1
        </button>
        <button
          onClick={() => setFormFilter("13D", null)}
          className={`rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            activeForm === "13D"
              ? "bg-cyan-400 text-[#07080B] shadow-md shadow-cyan-400/10"
              : "text-[#8892A6] hover:text-[#E8ECF4] hover:bg-[#12151D]"
          }`}
        >
          Form 13D
        </button>
        <button
          onClick={() => setFormFilter(null, "3a10")}
          className={`rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            activeFilter === "3a10"
              ? "bg-cyan-400 text-[#07080B] shadow-md shadow-cyan-400/10"
              : "text-[#8892A6] hover:text-[#E8ECF4] hover:bg-[#12151D]"
          }`}
        >
          3(a)(10) Exemption
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-[#1B2030] bg-[#0F1218] px-4 py-3">
        <Search className="h-4 w-4 text-[#8892A6]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search filings by ticker, name, or form..."
          className="flex-1 bg-transparent text-sm text-[#E8ECF4] placeholder-[#8892A6]/60 outline-none"
        />
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[60px_60px_1fr_80px] md:grid-cols-[60px_80px_1fr_100px_100px_80px_100px] items-center gap-2 md:gap-4 border-b border-[#1B2030] px-3 md:px-5 py-3 text-[9px] md:text-[10px] font-medium uppercase tracking-widest text-[#8892A6]">
        <span>Score</span>
        <span>Ticker</span>
        <span>Issuer / Insider</span>
        <span className="hidden md:block">Tier</span>
        <span className="hidden md:block">Flags</span>
        <span className="hidden md:block">Form</span>
        <span className="text-right">Filed</span>
      </div>

      {/* Table Body */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-1">
        {sortedFilings.map((filing: any) => {
          const isNew = new Date().getTime() - new Date(filing.filedAt).getTime() < 24 * 60 * 60 * 1000;
          return (
            <motion.div
              key={filing.id}
              onClick={() => handleFilingClick(filing)}
              variants={item}
              className={`group grid grid-cols-[60px_60px_1fr_80px] md:grid-cols-[60px_80px_1fr_100px_100px_80px_100px] items-center gap-2 md:gap-4 border-b border-[#1B2030]/50 px-3 md:px-5 py-4 transition-all duration-200 hover:bg-[#0F1218] cursor-pointer ${
                isNew ? "bg-cyan-500/5" : ""
              }`}
            >
              <div className="relative shrink-0">
                <ScoreBadge score={filing.score} />
              </div>

              <span className="font-mono text-xs md:text-sm font-bold text-cyan-400 shrink-0">
                {filing.Issuer?.ticker || "N/A"}
              </span>

              <div className="min-w-0">
                <p className="truncate text-[10px] md:text-xs font-bold text-cyan-400 uppercase tracking-tight">
                  {filing.Insider?.fullName || "CORPORATE FILING"}
                </p>
                <p className="truncate text-xs md:text-sm font-medium text-[#E8ECF4]">
                  {filing.Issuer?.name}
                </p>
                {(filing.Insider?.city || filing.Insider?.state) && (
                  <p className="truncate text-[9px] text-[#8892A6] mt-0.5">
                    {filing.Insider?.city}{filing.Insider?.city && filing.Insider?.state ? ', ' : ''}{filing.Insider?.state}
                  </p>
                )}
              </div>

              <div className="hidden md:block">
                <Badge variant="outline" className="text-[9px] font-semibold uppercase bg-cyan-500/10 text-cyan-400 border-0">
                  {filing.Issuer?.marketTier?.replace("_", " ") || "OTCPK"}
                </Badge>
              </div>

              <div className="hidden md:flex gap-1">
                {filing.hasAgedDebt && <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-400 font-bold">DEBT</span>}
                {filing.hasRestricted && <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-[9px] text-rose-400 font-bold">144</span>}
                {filing.has3a10 && <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[9px] text-cyan-400 font-bold">3A10</span>}
              </div>

              <span className="hidden md:block font-mono text-xs text-[#E8ECF4]">
                {formatFormType(filing.formType)}
              </span>

              <span className="flex items-center justify-end gap-3 text-[10px] md:text-xs text-[#8892A6] shrink-0">
                {new Date(filing.filedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                <a 
                  href={getReadableFilingUrl(filing)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded hover:bg-[#1B2030] shrink-0 group/link"
                  title="View clean SEC HTML filing"
                >
                  <FileText className="h-3.5 w-3.5 text-[#2A3050] transition-colors group-hover/link:text-cyan-400" />
                </a>
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setSize(size + 1)}
            disabled={isLoadingMore}
            className="rounded-lg border border-[#1B2030] bg-[#0F1218] px-6 py-2 text-xs font-bold uppercase tracking-widest text-cyan-400 hover:border-cyan-400/30 hover:bg-[#12151D] disabled:opacity-50 transition-all"
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
