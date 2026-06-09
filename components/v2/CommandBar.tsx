"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  FileText,
  Users,
  Settings,
  LayoutDashboard,
  TrendingUp,
  Building2,
  Loader2,
  Network,
  User,
} from "lucide-react";

interface SearchResults {
  filings: { id: string; formType: string; filedAt: string; insiderName: string; issuerName: string; score: number }[];
  contacts: { id: string; name: string; issuerName: string; ticker: string; role: string; score: number; band: string }[];
  issuers: { id: string; name: string; ticker: string; cik: string; status: string }[];
}

export function CommandBar() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [searching, setSearching] = React.useState(false);
  const router = useRouter();
  const debounceRef = React.useRef<any>(null);

  // Listen for ⌘K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setResults(data);
        })
        .catch(() => null)
        .finally(() => setSearching(false));
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const hasResults = results && (results.filings.length > 0 || results.contacts.length > 0 || results.issuers.length > 0);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Search"
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-[#1B2030] bg-[#0F1218] shadow-2xl shadow-cyan-500/10">
        {/* Search Input */}
        <div className="flex items-center border-b border-[#1B2030] px-4 py-3">
          {searching ? (
            <Loader2 className="mr-3 h-5 w-5 text-cyan-400 animate-spin" />
          ) : (
            <Search className="mr-3 h-5 w-5 text-cyan-400" />
          )}
          <Command.Input
            placeholder="Search filings, contacts, issuers..."
            className="flex-1 bg-transparent text-[#E8ECF4] placeholder-[#8892A6] outline-none text-sm"
            value={query}
            onValueChange={setQuery}
          />
          <div className="flex items-center gap-1.5 rounded bg-[#1B2030] px-1.5 py-0.5 text-[10px] font-bold text-[#8892A6]">
            ESC
          </div>
        </div>

        <Command.List className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
          <Command.Empty className="py-8 text-center text-sm text-[#8892A6]">
            {query.length < 2
              ? "Type at least 2 characters to search..."
              : searching
              ? "Searching..."
              : "No results found."}
          </Command.Empty>

          {/* Live Search Results */}
          {hasResults && (
            <>
              {/* Filings */}
              {results.filings.length > 0 && (
                <Command.Group
                  heading={
                    <span className="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                      Filings ({results.filings.length})
                    </span>
                  }
                >
                  {results.filings.map((f) => (
                    <Command.Item
                      key={f.id}
                      value={`filing ${f.insiderName} ${f.issuerName}`}
                      onSelect={() => go(`/filings?filingId=${f.id}`)}
                      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#E8ECF4] transition-colors hover:bg-[#1B2030] aria-selected:bg-[#1B2030]"
                    >
                      <FileText className="h-4 w-4 text-[#8892A6] group-hover:text-cyan-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold truncate">{f.insiderName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-400 font-bold flex-shrink-0">
                            {f.formType}
                          </span>
                        </div>
                        <span className="text-xs text-[#8892A6] truncate block">
                          {f.issuerName} • {new Date(f.filedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Contacts */}
              {results.contacts.length > 0 && (
                <Command.Group
                  heading={
                    <span className="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      Contacts ({results.contacts.length})
                    </span>
                  }
                >
                  {results.contacts.map((c) => (
                    <Command.Item
                      key={c.id}
                      value={`contact ${c.name} ${c.issuerName}`}
                      onSelect={() => go(`/contacts?contactId=${c.id}`)}
                      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#E8ECF4] transition-colors hover:bg-[#1B2030] aria-selected:bg-[#1B2030]"
                    >
                      <User className="h-4 w-4 text-[#8892A6] group-hover:text-emerald-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold truncate">{c.name}</span>
                          {c.role && (
                            <span className="text-[10px] text-[#8892A6] truncate">{c.role}</span>
                          )}
                        </div>
                        <span className="text-xs text-[#8892A6] truncate block">
                          {c.issuerName} {c.ticker ? `• ${c.ticker}` : ""}
                        </span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Issuers */}
              {results.issuers.length > 0 && (
                <Command.Group
                  heading={
                    <span className="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400">
                      Issuers ({results.issuers.length})
                    </span>
                  }
                >
                  {results.issuers.map((i) => (
                    <Command.Item
                      key={i.id}
                      value={`issuer ${i.name} ${i.ticker}`}
                      onSelect={() => go(`/filings?cik=${i.cik}`)}
                      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#E8ECF4] transition-colors hover:bg-[#1B2030] aria-selected:bg-[#1B2030]"
                    >
                      <Building2 className="h-4 w-4 text-[#8892A6] group-hover:text-amber-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold truncate block">{i.name}</span>
                        <span className="text-xs text-[#8892A6]">
                          {i.ticker ? `$${i.ticker} • ` : ""}CIK {i.cik}
                        </span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </>
          )}

          {/* Quick Navigation (shown when no search query) */}
          {!query && (
            <>
              <Command.Group
                heading={
                  <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#4A5568]">
                    Navigation
                  </span>
                }
              >
                <NavItem icon={LayoutDashboard} onSelect={() => go("/dashboard")}>Dashboard</NavItem>
                <NavItem icon={FileText} onSelect={() => go("/filings")}>Filings</NavItem>
                <NavItem icon={TrendingUp} onSelect={() => go("/signals")}>Signals</NavItem>
                <NavItem icon={Users} onSelect={() => go("/contacts")}>Contacts</NavItem>
                <NavItem icon={Network} onSelect={() => go("/ecosystem")}>Market Map</NavItem>
                <NavItem icon={Settings} onSelect={() => go("/settings")}>Settings</NavItem>
              </Command.Group>
            </>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}

function NavItem({
  children,
  icon: Icon,
  onSelect,
}: {
  children: React.ReactNode;
  icon: any;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#E8ECF4] transition-colors hover:bg-[#1B2030] aria-selected:bg-[#1B2030]"
    >
      <Icon className="h-4 w-4 text-[#8892A6] group-hover:text-cyan-400" />
      {children}
    </Command.Item>
  );
}
