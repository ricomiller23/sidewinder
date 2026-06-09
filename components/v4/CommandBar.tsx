"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommandBarV4() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }

    // Simplified search for now
    const res = await fetch(`/api/v4/search?q=${val}`);
    const json = await res.json();
    if (json.success) setResults(json.data);
  };

  if (!isOpen) return (
    <button 
      onClick={() => setIsOpen(true)}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 v4-glass-card px-6 py-3 flex items-center gap-3 text-v4-text-secondary hover:text-v4-primary border-v4-primary/20 shadow-2xl z-50 group"
    >
      <span className="text-xs font-bold opacity-60">⌘K</span>
      <span className="text-sm font-medium">Quick Search...</span>
      <div className="w-2 h-2 rounded-full bg-v4-primary animate-pulse group-hover:scale-125 transition-transform" />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl v4-glass-card overflow-hidden shadow-[0_0_100px_rgba(0,242,255,0.1)] border-v4-primary/30">
        <div className="p-6 border-b border-white/5">
          <input 
            autoFocus
            type="text"
            placeholder="Search CIKs, Tickers, or Forensic Patterns..."
            className="w-full bg-transparent text-2xl font-outfit outline-none placeholder:text-v4-text-muted text-v4-primary"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {results.length > 0 ? (
            results.map((item, i) => (
              <button 
                key={i}
                className="w-full text-left p-4 rounded-xl hover:bg-white/5 flex items-center justify-between group transition-all"
                onClick={() => {
                  router.push(`/v4/entity/${item.id}`);
                  setIsOpen(false);
                }}
              >
                <div>
                  <div className="font-bold text-white group-hover:text-v4-primary">{item.name}</div>
                  <div className="text-xs text-v4-text-muted flex gap-2">
                    <span>{item.cik}</span>
                    {item.ticker && <span className="text-v4-primary/60">{item.ticker}</span>}
                  </div>
                </div>
                <div className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-v4-text-secondary uppercase">
                  {item.role}
                </div>
              </button>
            ))
          ) : query.length > 1 ? (
            <div className="p-12 text-center text-v4-text-muted italic">
              No entities found matching "{query}"
            </div>
          ) : (
            <div className="p-8 text-center text-v4-text-muted text-sm">
              Try searching for "Amgen" or "Form 4"
            </div>
          )}
        </div>

        <div className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center text-[10px] font-bold text-v4-text-muted uppercase tracking-widest">
          <div className="flex gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <div className="flex gap-4">
            <span>ESC Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
