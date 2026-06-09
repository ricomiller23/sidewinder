import React from "react";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ContactTableProps {
  contacts: any[];
  onSelect: (id: string) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}

export function ContactsTable({ contacts, onSelect, selectedIds, onToggleSelect, onToggleSelectAll }: ContactTableProps) {
  const allSelected = contacts.length > 0 && selectedIds.length === contacts.length;

  return (
    <div className="overflow-x-auto rounded-xl border border-[#1B2030] bg-[#0F1218]">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-[#1B2030] bg-[#07080B]/50">
            <th className="p-4 w-10">
              <input 
                type="checkbox" 
                checked={allSelected} 
                onChange={onToggleSelectAll}
                className="accent-cyan-400"
              />
            </th>
            <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#8892A6]">Contact</th>
            <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#8892A6]">Issuer</th>
            <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#8892A6]">Score</th>
            <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#8892A6]">Thesis</th>
            <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#8892A6]">Status</th>
            <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#8892A6]">Filing</th>
            <th className="p-4 w-10 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1B2030]">
          {contacts.map((contact) => (
            <tr 
              key={contact.contact_id} 
              className="group hover:bg-[#1B2030]/30 transition-colors cursor-pointer"
              onClick={() => onSelect(contact.contact_id)}
            >
              <td className="p-4" onClick={(e) => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(contact.contact_id)} 
                  onChange={() => onToggleSelect(contact.contact_id)}
                  className="accent-cyan-400"
                />
              </td>
              <td className="p-4">
                <div className="flex flex-col">
                  <span className="font-bold text-[#E8ECF4] group-hover:text-cyan-400 transition-colors">
                    {contact.contact_name}
                  </span>
                  <span className="text-[10px] text-[#8892A6]">
                    {contact.role_title || "Other"}
                  </span>
                </div>
              </td>
              <td className="p-4">
                <div className="flex flex-col">
                  <span className="font-medium text-[#E8ECF4]">{contact.issuer_name}</span>
                  <span className="text-[10px] font-mono text-cyan-400/80">{contact.ticker}</span>
                </div>
              </td>
              <td className="p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${
                      contact.score_band === 'hot' ? 'text-rose-400' : 
                      contact.score_band === 'warm' ? 'text-amber-400' : 'text-[#8892A6]'
                    }`}>
                      {contact.outreach_score}
                    </span>
                    <div className="h-1 w-12 bg-[#1B2030] rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          contact.score_band === 'hot' ? 'bg-rose-400' : 
                          contact.score_band === 'warm' ? 'bg-amber-400' : 'bg-[#8892A6]'
                        }`}
                        style={{ width: `${contact.outreach_score}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-tighter text-[#8892A6]">
                    {contact.score_band}
                  </span>
                </div>
              </td>
              <td className="p-4">
                <Badge variant="outline" className="text-[9px] uppercase border-[#2A3050] bg-[#1B2030]/50">
                  {contact.thesis_type}
                </Badge>
                {contact.why_this_contact && (
                  <p className="mt-1 text-[10px] text-[#8892A6] line-clamp-1 max-w-[150px]">
                    {contact.why_this_contact}
                  </p>
                )}
              </td>
              <td className="p-4">
                <Badge className={`text-[10px] font-bold ${
                  contact.status === 'new' ? 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20' :
                  contact.status === 'contacted' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                  contact.status === 'possible_inventory' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                  'bg-[#1B2030] text-[#8892A6] border-transparent'
                }`}>
                  {contact.status.replace('_', ' ')}
                </Badge>
              </td>
              <td className="p-4">
                {(() => {
                  const url = contact.latest_filing_url || (contact.cik ? `https://www.sec.gov/edgar/browse/?CIK=${String(contact.cik).padStart(10, '0')}` : null);
                  if (url) {
                    const isSecUrl = url.includes("sec.gov/edgar/browse");
                    return (
                      <a 
                        href={url}
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors group/filing"
                        title={isSecUrl ? "Search SEC Filings" : "View Latest SEC Filing"}
                      >
                        <FileText className="h-4 w-4 text-[#8892A6] group-hover/filing:text-cyan-400 transition-colors" /> 
                        {isSecUrl ? "SEC Profile" : "View Filing"}
                      </a>
                    );
                  }
                  return <span className="text-xs text-[#8892A6]/40 italic">No filing linked</span>;
                })()}
              </td>
              <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                <button className="p-1 hover:bg-[#1B2030] rounded-md transition-colors text-[#8892A6] opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
