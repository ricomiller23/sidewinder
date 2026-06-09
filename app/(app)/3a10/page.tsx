// app/(app)/3a10/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Scale, Calendar, DollarSign, Award, Users, 
  Search, SlidersHorizontal, ArrowUpDown, Download, 
  ExternalLink, Send, Check, Bell, Save, RefreshCw,
  Loader2, AlertCircle, Info, ChevronRight, X
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Filing3a10 {
  id: string;
  filing_id: string;
  cik: string;
  company_name: string;
  ticker?: string;
  filing_date: string;
  filing_type: string;
  transaction_type?: string;
  securities_being_exchanged?: string;
  value_of_securities?: number;
  number_of_shares?: number;
  court_approval: boolean;
  court_approval_date?: string;
  exchange_ratio?: string;
  beneficial_holders?: number;
  security_type?: string;
  restriction_details?: string;
  holding_period?: number;
  source_url?: string;
  extracted_text?: string;
  is_new: boolean;
  is_reviewed: boolean;
  is_relevant: boolean;
  relevance_score?: number;
  identified_contacts?: Array<{
    name: string;
    title: string;
    email: string;
    phone: string;
    source: string;
  }>;
  outreach_status: string;
  outreach_contact_id?: string;
}

export default function Page3a10() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [courtApproval, setCourtApproval] = useState("");
  const [valueRange, setValueRange] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [sortBy, setSortBy] = useState("filing_date");
  const [sortOrder, setSortOrder] = useState("desc");
  
  const [selectedFiling, setSelectedFiling] = useState<Filing3a10 | null>(null);
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const [syncingFilingId, setSyncingFilingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Alerts Settings State
  const [alertsSettings, setAlertsSettings] = useState({
    alert3a10Enabled: true,
    alert3a10Slack: false,
    alert3a10MinVal: 100000,
    alert3a10Type: "all"
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Construct URL
  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.set("search", debouncedSearch);
  if (transactionType) queryParams.set("transactionType", transactionType);
  if (courtApproval) queryParams.set("courtApproval", courtApproval);
  if (dateRange) queryParams.set("dateRange", dateRange);
  if (sortBy) queryParams.set("sortBy", sortBy);
  if (sortOrder) queryParams.set("sortOrder", sortOrder);

  // Value range parsing
  if (valueRange === "small") {
    queryParams.set("minValue", "0");
    queryParams.set("maxValue", "100000");
  } else if (valueRange === "medium") {
    queryParams.set("minValue", "100000");
    queryParams.set("maxValue", "1000000");
  } else if (valueRange === "large") {
    queryParams.set("minValue", "1000000");
  }

  const { data, error, isLoading, mutate } = useSWR(
    `/api/3a10-filings?${queryParams.toString()}`,
    fetcher
  );

  // Fetch Alerts Settings
  useEffect(() => {
    fetch("/api/3a10-filings/alerts")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setAlertsSettings(data);
      });
  }, []);

  const handleSaveAlerts = async () => {
    try {
      const res = await fetch("/api/3a10-filings/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertsSettings)
      });
      if (res.ok) {
        setShowAlertsDrawer(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/3a10-filings/refresh", { method: "POST" });
      mutate();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePushToCRM = async (filing: Filing3a10, e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncingFilingId(filing.id);
    try {
      const res = await fetch(`/api/3a10-filings/${filing.id}/add-to-crm`, {
        method: "POST"
      });
      if (res.ok) {
        mutate();
        if (selectedFiling?.id === filing.id) {
          setSelectedFiling({
            ...selectedFiling,
            outreach_status: "contacted"
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingFilingId(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch("/api/3a10-filings/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: data?.data?.map((f: any) => f.id) || [] })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "3a10-filings-export.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#E8ECF4] tracking-tight flex items-center gap-3">
            Section 3(a)(10) Monitoring
            <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          </h1>
          <p className="mt-1 text-sm text-[#8892A6]">
            Real-time parsing and alert tracking for court-approved debt settlements and stock exchange exemptions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAlertsDrawer(true)}
            className="flex items-center gap-2 rounded-lg border border-[#1B2030] bg-[#0F1218] px-4 py-2 text-xs font-semibold text-[#8892A6] hover:text-[#E8ECF4] transition-all"
          >
            <Bell className="h-4 w-4" />
            Alert Rules
          </button>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-[#1B2030] bg-[#0F1218] px-4 py-2 text-xs font-semibold text-[#8892A6] hover:text-[#E8ECF4] transition-all disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh EDGAR
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-[#07080B] hover:bg-cyan-300 transition-all shadow-md shadow-cyan-400/10"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border border-[#1B2030]/50 bg-[#0F1218]/40">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8892A6]/50" />
          <input
            type="text"
            placeholder="Search company, ticker, CIK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#07080B] border border-[#1B2030] rounded-lg text-xs text-[#E8ECF4] placeholder-[#8892A6]/50 outline-none focus:border-cyan-400/40"
          />
        </div>

        <select
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          className="bg-[#07080B] border border-[#1B2030] rounded-lg text-xs px-3 py-2 text-[#8892A6] outline-none"
        >
          <option value="">All Transaction Types</option>
          <option value="debt_settlement">Debt Settlement</option>
          <option value="stock_exchange">Stock Exchange</option>
          <option value="merger_consideration">Merger Consideration</option>
        </select>

        <select
          value={courtApproval}
          onChange={(e) => setCourtApproval(e.target.value)}
          className="bg-[#07080B] border border-[#1B2030] rounded-lg text-xs px-3 py-2 text-[#8892A6] outline-none"
        >
          <option value="">All Court Statuses</option>
          <option value="true">Approved</option>
          <option value="false">Pending / Not Required</option>
        </select>

        <select
          value={valueRange}
          onChange={(e) => setValueRange(e.target.value)}
          className="bg-[#07080B] border border-[#1B2030] rounded-lg text-xs px-3 py-2 text-[#8892A6] outline-none"
        >
          <option value="">All Value Ranges</option>
          <option value="small">$0 - $100K</option>
          <option value="medium">$100K - $1M</option>
          <option value="large">$1M+</option>
        </select>
      </div>

      {/* Main Grid List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#8892A6]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
          <p className="text-xs">Querying filing database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.data?.length === 0 ? (
            <div className="col-span-full py-20 text-center border border-dashed border-[#1B2030] rounded-xl bg-[#0F1218]/10 text-zinc-500 italic text-sm">
              No 3(a)(10) filings match the current screening rules.
            </div>
          ) : (
            data?.data?.map((filing: Filing3a10) => (
              <div
                key={filing.id}
                onClick={() => setSelectedFiling(filing)}
                className="bg-[#0F1218]/60 border border-[#1B2030] hover:border-[#2A3050] transition-all rounded-xl p-5 cursor-pointer relative group flex flex-col justify-between min-h-[220px]"
              >
                {/* Upper Details */}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] text-zinc-500 font-bold bg-[#1B2030] px-2 py-0.5 rounded">
                      {filing.ticker || filing.cik || "OTC"}
                    </span>
                    {filing.is_new && (
                      <span className="bg-cyan-400/10 text-cyan-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-cyan-400/20">NEW</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#E8ECF4] group-hover:text-cyan-400 transition-colors truncate mb-1">
                    {filing.company_name}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mb-4">{new Date(filing.filing_date).toLocaleDateString()} · {filing.filing_type === "8k_notice" ? "8-K Notice" : "3(a)(10) Exemption"}</p>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">Position Value</span>
                      <span className="text-xs font-bold text-cyan-400">{formatCurrency(filing.value_of_securities)}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">Exemption Type</span>
                      <span className="text-xs font-bold text-zinc-300 truncate block">{filing.transaction_type?.replace("_", " ") || "Debt Settlement"}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom syncing bar */}
                <div className="flex items-center justify-between border-t border-[#1B2030]/60 pt-3 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Scale className={`h-3.5 w-3.5 ${filing.court_approval ? "text-amber-400" : "text-zinc-500"}`} />
                    <span className="text-[9px] font-bold text-zinc-400">{filing.court_approval ? "Court Approved" : "Pending Approval"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {filing.source_url && (
                      <a
                        href={filing.source_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-2.5 py-1 border border-[#1B2030] rounded bg-[#07080B]/50 hover:bg-[#1B2030]/40 transition-colors text-[10px] font-bold text-zinc-400 hover:text-cyan-400"
                        title="View SEC Filing"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Filing</span>
                      </a>
                    )}
                    <button
                      onClick={(e) => handlePushToCRM(filing, e)}
                      disabled={syncingFilingId !== null || filing.outreach_status === "contacted"}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold transition-all ${
                        filing.outreach_status === "contacted"
                          ? "bg-emerald-950/20 text-emerald-400 border border-emerald-800/40 cursor-default"
                          : "bg-cyan-400 hover:bg-cyan-300 text-[#07080B]"
                      }`}
                    >
                      {syncingFilingId === filing.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : filing.outreach_status === "contacted" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      {filing.outreach_status === "contacted" ? "Synced" : "Sync CRM"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Filing Detail Drawer */}
      {selectedFiling && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            onClick={() => setSelectedFiling(null)}
            className="absolute inset-0 bg-[#07080B]/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-xl h-full bg-[#0A0C10] border-l border-[#1B2030] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[#1B2030] flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-500 font-bold bg-[#1B2030] px-2 py-0.5 rounded">
                  {selectedFiling.ticker || "OTC"}
                </span>
                <h2 className="text-base font-bold text-[#E8ECF4] mt-2">{selectedFiling.company_name}</h2>
                <p className="text-[10px] text-zinc-500 mt-1">{new Date(selectedFiling.filing_date).toLocaleDateString()} · CIK: {selectedFiling.cik}</p>
              </div>
              <button 
                onClick={() => setSelectedFiling(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Core 3a10 Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-[#0F1218]/40 border border-[#1B2030] rounded-xl p-4">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">Security Value</span>
                  <span className="text-sm font-black text-cyan-400">{formatCurrency(selectedFiling.value_of_securities)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">Shares Exchanged</span>
                  <span className="text-sm font-black text-[#E8ECF4]">{selectedFiling.number_of_shares?.toLocaleString() || "—"}</span>
                </div>
                <div className="col-span-2 border-t border-[#1B2030]/40 pt-3">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">Court Status</span>
                  <span className="text-xs font-bold text-zinc-300 mt-1 block">{selectedFiling.court_approval ? "Court Approval Confirmed" : "Court Approval Status Not Specified"}</span>
                </div>
              </div>

              {/* Excerpt Exceeded Texts */}
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-2 font-bold">Filing Excerpt</span>
                <div className="bg-[#07080B] border border-[#1B2030] rounded-lg p-4 text-xs font-mono leading-relaxed text-[#8892A6]">
                  {selectedFiling.extracted_text || "No excerpt text generated for this filing."}
                </div>
              </div>

              {/* Identified Contacts list */}
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-3 font-bold">Identified Contacts</span>
                <div className="space-y-3">
                  {selectedFiling.identified_contacts && selectedFiling.identified_contacts.length > 0 ? (
                    selectedFiling.identified_contacts.map((contact, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-[#1B2030] rounded-lg bg-[#0F1218]/20">
                        <div>
                          <span className="text-xs font-bold text-[#E8ECF4] block">{contact.name}</span>
                          <span className="text-[10px] text-zinc-500">{contact.title || "Investor Contact"}</span>
                        </div>
                        <div className="text-[10px] text-right text-zinc-500">
                          <span className="block">{contact.email || "No Email"}</span>
                          <span>{contact.phone || "No Phone"}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 border border-[#1B2030] rounded-lg bg-[#0F1218]/10 text-zinc-500 italic text-[10px]">
                      No specific contacts identified in text. Using fallback Company Investor Desk.
                    </div>
                  )}
                </div>
              </div>

              {/* Sync CRM Action block */}
              <div className="border-t border-[#1B2030]/60 pt-4 flex gap-4">
                <button
                  onClick={(e) => handlePushToCRM(selectedFiling, e)}
                  disabled={syncingFilingId !== null || selectedFiling.outreach_status === "contacted"}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg text-xs font-bold transition-all ${
                    selectedFiling.outreach_status === "contacted"
                      ? "bg-emerald-950/20 text-emerald-400 border border-emerald-800/40 cursor-default"
                      : "bg-cyan-400 hover:bg-cyan-300 text-[#07080B]"
                  }`}
                >
                  {syncingFilingId === selectedFiling.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : selectedFiling.outreach_status === "contacted" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {selectedFiling.outreach_status === "contacted" ? "Filing successfully added to CRM" : "Sync this Filing to CRM"}
                </button>
                
                {selectedFiling.source_url && (
                  <a
                    href={selectedFiling.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center p-3 border border-[#1B2030] rounded-lg hover:bg-[#1B2030]/30 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-zinc-400" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Settings Rules Drawer */}
      {showAlertsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            onClick={() => setShowAlertsDrawer(false)}
            className="absolute inset-0 bg-[#07080B]/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm h-full bg-[#0A0C10] border-l border-[#1B2030] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[#1B2030] flex items-center justify-between">
              <h2 className="text-xs font-black text-[#E8ECF4] uppercase tracking-wider flex items-center gap-2">
                <Bell className="h-4 w-4 text-cyan-400" />
                Alert Configuration
              </h2>
              <button 
                onClick={() => setShowAlertsDrawer(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Alert Type</label>
                <select
                  value={alertsSettings.alert3a10Type}
                  onChange={(e) => setAlertsSettings({...alertsSettings, alert3a10Type: e.target.value})}
                  className="w-full bg-[#07080B] border border-[#1B2030] rounded-lg p-2.5 text-xs text-[#E8ECF4]"
                >
                  <option value="all">All 3(a)(10) Exemption Filings</option>
                  <option value="debt_settlement">Debt Settlements Only</option>
                  <option value="large">High Value Only</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Min Value Threshold (USD)</label>
                <input
                  type="number"
                  value={alertsSettings.alert3a10MinVal}
                  onChange={(e) => setAlertsSettings({...alertsSettings, alert3a10MinVal: parseFloat(e.target.value) || 0})}
                  className="w-full bg-[#07080B] border border-[#1B2030] rounded-lg p-2.5 text-xs text-[#E8ECF4]"
                />
              </div>

              <div className="space-y-3 pt-3">
                <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertsSettings.alert3a10Enabled}
                    onChange={(e) => setAlertsSettings({...alertsSettings, alert3a10Enabled: e.target.checked})}
                    className="rounded bg-[#07080B] border-[#1B2030] text-cyan-400"
                  />
                  Enable Dashboard alerts
                </label>

                <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertsSettings.alert3a10Slack}
                    onChange={(e) => setAlertsSettings({...alertsSettings, alert3a10Slack: e.target.checked})}
                    className="rounded bg-[#07080B] border-[#1B2030] text-cyan-400"
                  />
                  Post high-value alerts to Slack
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-[#1B2030] bg-[#0F1218]/30">
              <button
                onClick={handleSaveAlerts}
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-[#07080B] font-bold py-2.5 rounded-lg text-xs transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
