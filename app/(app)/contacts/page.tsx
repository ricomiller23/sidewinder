"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { ContactsMetricsBar } from "@/components/contacts/contacts-metrics-bar";
import { ContactsToolbar } from "@/components/contacts/contacts-toolbar";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ContactsSavedViews } from "@/components/contacts/contacts-saved-views";
import { ContactDetailDrawer } from "@/components/contacts/contact-detail-drawer";
import { Loader2, AlertCircle, ArrowUpDown } from "lucide-react";
import { bulkExportToVcf } from "@/lib/utils/vcf";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ContactsPage() {
  const [currentView, setCurrentView] = useState("all-contacts");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [allContacts, setAllContacts] = useState<unknown[]>([]);
  const [sortByNames, setSortByNames] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/contacts?view=${currentView}&q=${debouncedSearch}&page=${page}`,
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30s
  );

  React.useEffect(() => {
    if (data?.data) {
      if (page === 1) {
        setAllContacts(data.data);
      } else {
        setAllContacts(prev => [...prev, ...data.data]);
      }
    }
  }, [data, page]);

  // Reset page when view or search changes
  React.useEffect(() => {
    setPage(1);
    setAllContacts([]);
  }, [currentView, debouncedSearch]);

  const sortedContacts = React.useMemo(() => {
    let result = [...allContacts];
    if (sortByNames) {
      result.sort((a: any, b: any) => {
        const nameA = a.contact_name || "";
        const nameB = b.contact_name || "";
        const companyA = a.issuer_name || "";
        const companyB = b.issuer_name || "";

        const hasNameA = !!a.contact_name;
        const hasNameB = !!b.contact_name;

        if (hasNameA && !hasNameB) return -1;
        if (!hasNameA && hasNameB) return 1;

        if (hasNameA && hasNameB) {
          const compareNames = nameA.localeCompare(nameB);
          if (compareNames !== 0) return compareNames;
          return companyA.localeCompare(companyB);
        } else {
          return companyA.localeCompare(companyB);
        }
      });
    }
    return result;
  }, [allContacts, sortByNames]);

  const contacts = sortedContacts;
  const metrics = data?.metrics || {
    contacts_in_queue: data?.pagination?.total || 0,
    high_priority_contacts: 0,
    follow_ups_due_today: 0,
    positive_replies_this_week: 0,
    possible_inventory_count: 0,
    avg_days_since_last_touch: 0
  };

  // Intersection Observer for Infinite Scroll
  const observerTarget = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && data?.pagination && page < data.pagination.total_pages && !isLoading) {
          setPage(p => p + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [data, page, isLoading]);

  const handleSelectContact = (id: string) => {
    setSelectedContactId(id);
    setIsDrawerOpen(true);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    setSelectedIds(prev => 
      prev.length === contacts.length ? [] : contacts.map((c: any) => c.contact_id)
    );
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on`, selectedIds);
    // Implementation for bulk actions
  };

  const handleExport = () => {
    const selectedContacts = contacts.filter((c: any) => selectedIds.includes(c.contact_id));
    const toExport = selectedContacts.length > 0 ? selectedContacts : contacts;
    bulkExportToVcf(toExport);
  };

  if (error) return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-[#8892A6]">
      <AlertCircle className="h-12 w-12 mb-4 text-rose-500" />
      <h3 className="text-xl font-bold text-[#E8ECF4]">Failed to load CRM data</h3>
      <p className="mt-2 text-sm max-w-md text-center">
        There was an error connecting to the operator console. Please check your connection and try again.
      </p>
      <button 
        onClick={() => mutate()}
        className="mt-6 px-6 py-2 bg-cyan-400 text-[#07080B] rounded-lg font-bold hover:bg-cyan-300 transition-all"
      >
        Retry Connection
      </button>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen overflow-hidden">
      {/* Left Rail: Navigation & Views */}
      <div className="hidden lg:flex p-6 border-r border-[#1B2030]/50">
        <ContactsSavedViews 
          currentView={currentView} 
          onViewChange={setCurrentView}
          views={[]} 
          counts={{
            "todays-queue": metrics.contacts_in_queue,
            "all-contacts": data?.pagination?.total || 0
          }}
        />
      </div>

      {/* Main Console: Metrics, Toolbar, Table */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#07080B]">
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Header */}
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black text-[#E8ECF4] tracking-tight flex items-center gap-3">
                Operator Console
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </h1>
              <p className="mt-1 text-sm text-[#8892A6] font-medium">
                {currentView.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} • Managing {metrics.contacts_in_queue} targets
              </p>
            </div>
            <div className="flex items-center gap-3">
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
              <button 
                onClick={handleExport}
                className="px-4 py-2 text-xs font-bold text-[#8892A6] hover:text-[#E8ECF4] transition-colors"
              >
                Download vCard
              </button>
              <button className="px-4 py-2 bg-cyan-400 text-[#07080B] rounded-lg text-xs font-black uppercase tracking-wider hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-400/10">
                + Add Target
              </button>
            </div>
          </div>

          <ContactsMetricsBar metrics={metrics} />
          
          <ContactsToolbar 
            onSearch={setSearchQuery}
            onFilterChange={() => {}}
            selectedCount={selectedIds.length}
            onBulkAction={handleBulkAction}
          />

          <AnimatePresence mode="wait">
            {isLoading && contacts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-4" />
                <p className="text-sm text-[#8892A6] font-medium">Syncing operator queue...</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ContactsTable 
                  contacts={contacts}
                  onSelect={handleSelectContact}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                />
                
                {contacts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-[#8892A6] border border-[#1B2030] border-t-0 rounded-b-xl bg-[#0F1218]/30">
                    <p className="text-sm font-medium italic">No targets found in this view.</p>
                  </div>
                )}

                {/* Infinite Scroll Trigger */}
                <div ref={observerTarget} className="h-20 flex items-center justify-center">
                  {data?.pagination && page < data.pagination.total_pages && (
                    <div className="flex items-center gap-2 text-[#8892A6]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs font-medium">Loading more... ({data.pagination.total - contacts.length} remaining)</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Drawer: Contact Detail */}
      <ContactDetailDrawer 
        contactId={selectedContactId}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}
