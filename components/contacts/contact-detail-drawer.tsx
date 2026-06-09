"use client";

import React, { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, Mail, Phone, Building2, User, Copy, Check, Clock, 
  TrendingUp, ExternalLink, MessageSquare, StickyNote, 
  Calendar, ShieldCheck, History, Edit3, X, AlertCircle, FileText
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { getReadableFilingUrl } from "@/lib/edgar/urls";

export function ContactDetailDrawer({ 
  contactId, 
  open, 
  onOpenChange 
}: { 
  contactId: string | null, 
  open: boolean, 
  onOpenChange: (open: boolean) => void 
}) {
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"activity" | "thesis" | "info">("activity");
  const [notes, setNotes] = useState<string>("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (open && contactId) {
      setLoading(true);
      fetch(`/api/contacts/${contactId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setContact(data.data);
            setNotes(data.data.notes || "");
          }
        })
        .catch(err => console.error("Contact Detail Fetch Error:", err))
        .finally(() => setLoading(false));
    }
  }, [open, contactId]);

  const handleSaveNotes = async (newNotes: string) => {
    if (!contactId) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: newNotes }),
      });
      if (!res.ok) {
        throw new Error("Failed to save notes");
      }
      const data = await res.json();
      setContact(data.data);
      toast.success("Notes saved successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save private notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const copyToClipboard = (text: string | undefined, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  };

  if (!contactId && !open) return null;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="fixed right-0 top-0 bottom-0 w-full md:max-w-[520px] bg-[#07080B] border-l border-[#1B2030] shadow-2xl z-[101] outline-none flex flex-col">
          <Drawer.Title className="sr-only">Contact Details</Drawer.Title>
          
          <div className="flex flex-col h-full relative">
            <button 
              onClick={() => onOpenChange(false)}
              className="absolute top-6 right-6 p-2 text-[#8892A6] hover:text-[#E8ECF4] hover:bg-[#1B2030] rounded-full transition-all z-10"
            >
              <X className="h-5 w-5" />
            </button>
            
            {loading ? (
              <div className="flex flex-col h-full">
                <div className="p-8 border-b border-[#1B2030]">
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 w-20 bg-[#1B2030] rounded" />
                    <div className="h-8 w-64 bg-[#1B2030] rounded" />
                    <div className="h-4 w-48 bg-[#1B2030] rounded" />
                  </div>
                </div>
                <div className="flex-1 p-8 space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-2 animate-pulse">
                      <div className="h-3 w-24 bg-[#1B2030] rounded" />
                      <div className="h-20 w-full bg-[#1B2030] rounded-xl" />
                    </div>
                  ))}
                </div>
              </div>
            ) : contact ? (
              <>
                <div className="p-8 border-b border-[#1B2030]">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={`text-[10px] font-bold ${
                      contact.score_band === 'hot' ? 'bg-rose-400/10 text-rose-400 border-rose-400/20' :
                      contact.score_band === 'warm' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                      'bg-[#1B2030] text-[#8892A6]'
                    }`}>
                      {contact.score_band?.toUpperCase() || 'N/A'} • {contact.outreach_score || 0} PTS
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-[#1B2030] text-[#8892A6]">
                      {contact.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                    </Badge>
                  </div>
                  <h2 className="text-3xl font-bold text-[#E8ECF4] leading-tight mb-2">
                    {contact.contact_name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-[#8892A6]">
                    <Building2 className="h-4 w-4 text-cyan-400" />
                    <span className="font-medium text-[#E8ECF4]">{contact.issuer_name}</span>
                    <span className="text-[#2A3050]">|</span>
                    <span className="font-mono text-cyan-400/80">{contact.ticker}</span>
                  </div>
                </div>

                <div className="flex border-b border-[#1B2030] bg-[#0F1218]/50">
                  {["activity", "thesis", "info"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as "info" | "activity" | "thesis")}
                      className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                        activeTab === tab 
                          ? "text-cyan-400 border-cyan-400 bg-cyan-400/5" 
                          : "text-[#8892A6] border-transparent hover:text-[#E8ECF4] hover:bg-[#1B2030]/50"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {activeTab === "activity" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-[#8892A6] uppercase tracking-widest flex items-center gap-2">
                            <History className="h-4 w-4 text-cyan-400" />
                            Activity Timeline
                          </h3>
                          <button className="text-[10px] font-bold text-cyan-400 hover:underline uppercase">
                            + Log Activity
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="relative pl-6 border-l-2 border-[#1B2030] py-1">
                            <div className="absolute -left-[9px] top-2 h-4 w-4 rounded-full bg-[#07080B] border-2 border-cyan-400" />
                            <div className="bg-[#0F1218] border border-[#1B2030] rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-cyan-400 uppercase">Initial Discovery</span>
                                <span className="text-[10px] text-[#8892A6]">
                                  {contact.created_at ? `${formatDistanceToNow(new Date(contact.created_at))} ago` : "Recently"}
                                </span>
                              </div>
                              <p className="text-xs text-[#8892A6]">Contact record created via automated intake from SEC Form 4 filing.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "thesis" && (
                      <div className="space-y-8">
                        <section>
                          <h3 className="text-xs font-bold text-[#8892A6] uppercase tracking-widest flex items-center gap-2 mb-4">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            Strategic Thesis
                          </h3>
                          <div className="bg-[#0F1218] border border-[#1B2030] rounded-2xl p-6 leading-relaxed">
                            <p className="text-sm text-[#E8ECF4] mb-4">
                              {contact.thesis_summary || "No specific thesis summary available for this contact."}
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 rounded-xl bg-[#07080B] border border-[#1B2030]">
                                <p className="text-[9px] font-bold text-[#8892A6] uppercase mb-1">Why This Issuer</p>
                                <p className="text-xs text-[#E8ECF4]">{contact.why_this_issuer || "N/A"}</p>
                              </div>
                              <div className="p-3 rounded-xl bg-[#07080B] border border-[#1B2030]">
                                <p className="text-[9px] font-bold text-[#8892A6] uppercase mb-1">Why This Contact</p>
                                <p className="text-xs text-[#E8ECF4]">{contact.why_this_contact || "N/A"}</p>
                              </div>
                            </div>
                          </div>
                        </section>

                        <section>
                          <h3 className="text-xs font-bold text-[#8892A6] uppercase tracking-widest flex items-center gap-2 mb-4">
                            <TrendingUp className="h-4 w-4 text-amber-400" />
                            Score Explanation
                          </h3>
                          <div className="bg-[#0F1218] border border-[#1B2030] rounded-2xl p-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[#8892A6]">Thesis Strength</span>
                                <span className="font-bold text-[#E8ECF4]">{contact.thesis_strength_score}/20</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[#8892A6]">Role Relevance</span>
                                <span className="font-bold text-[#E8ECF4]">{contact.role_relevance_score}/20</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[#8892A6]">Contactability</span>
                                <span className="font-bold text-[#E8ECF4]">{contact.contactability_score}/5</span>
                              </div>
                              <div className="pt-3 border-t border-[#1B2030] flex items-center justify-between text-sm">
                                <span className="font-bold text-cyan-400">Total Outreach Score</span>
                                <span className="font-black text-cyan-400">{contact.outreach_score}</span>
                              </div>
                            </div>
                          </div>
                        </section>
                      </div>
                    )}

                    {activeTab === "info" && (
                      <div className="space-y-6">
                        <section>
                          <h3 className="text-xs font-bold text-[#8892A6] uppercase tracking-widest flex items-center gap-2 mb-4">
                            <User className="h-4 w-4 text-blue-400" />
                            Contact Information
                          </h3>
                          <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-[#0F1218] border border-[#1B2030] flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-[#8892A6]" />
                                <span className="text-sm text-[#E8ECF4]">{contact.email || "No email available"}</span>
                              </div>
                              {contact.email && (
                                <button onClick={() => copyToClipboard(contact.email, 'email')} className="p-1.5 hover:bg-[#1B2030] rounded-md transition-colors text-[#8892A6]">
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="p-4 rounded-xl bg-[#0F1218] border border-[#1B2030] flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-[#8892A6]" />
                                <span className="text-sm text-[#E8ECF4] font-bold text-cyan-400">{contact.phone || "No phone available"}</span>
                              </div>
                              {contact.phone && (
                                <button onClick={() => copyToClipboard(contact.phone, 'phone')} className="p-1.5 hover:bg-[#1B2030] rounded-md transition-colors text-[#8892A6]">
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </section>
                        
                        <section>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-[#8892A6] uppercase tracking-widest flex items-center gap-2">
                              <StickyNote className="h-4 w-4 text-amber-400" />
                              Private Notes
                            </h3>
                            {savingNotes ? (
                              <span className="text-[10px] text-cyan-400 font-medium animate-pulse">Saving...</span>
                            ) : notes !== (contact?.notes || "") ? (
                              <span className="text-[10px] text-amber-400 font-medium">Unsaved changes</span>
                            ) : contact?.notes ? (
                              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                <Check className="h-3 w-3" /> Saved
                              </span>
                            ) : null}
                          </div>
                          <textarea 
                            className="w-full h-32 bg-[#0F1218] border border-[#1B2030] rounded-xl p-4 text-sm text-[#E8ECF4] placeholder-[#8892A6]/40 focus:border-cyan-400/30 outline-none resize-none transition-all"
                            placeholder="Add private intel, context, or outreach strategy notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onBlur={() => {
                              if (notes !== (contact.notes || "")) {
                                handleSaveNotes(notes);
                              }
                            }}
                          />
                        </section>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-[#1B2030] bg-[#07080B] flex flex-col gap-3">
                  {(() => {
                    const filingUrl = contact.intel?.latestFiling 
                      ? getReadableFilingUrl(contact.intel.latestFiling) 
                      : (contact.cik ? `https://www.sec.gov/edgar/browse/?CIK=${String(contact.cik).padStart(10, '0')}` : null);
                    if (!filingUrl) return null;
                    const isSecUrl = filingUrl.includes("sec.gov/edgar/browse");
                    return (
                      <a 
                        href={filingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 rounded-xl bg-cyan-500 text-[#07080B] text-xs font-black uppercase tracking-wider hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
                      >
                        <FileText className="h-4 w-4" /> {isSecUrl ? "Open SEC Profile" : "Open Latest SEC Filing"}
                      </a>
                    );
                  })()}
                  <div className="flex items-center gap-3">
                    <button className="flex-1 py-3 rounded-xl bg-[#1B2030] text-[#E8ECF4] text-xs font-bold hover:bg-[#2A3050] transition-all flex items-center justify-center gap-2 border border-[#2A3050]/50">
                      <Edit3 className="h-4 w-4" /> Edit Profile
                    </button>
                    <button className="flex-1 py-3 rounded-xl bg-[#1B2030] text-[#E8ECF4] text-xs font-bold hover:bg-[#2A3050] transition-all flex items-center justify-center gap-2 border border-[#2A3050]/50">
                      <MessageSquare className="h-4 w-4" /> Next Action
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#8892A6] p-12 text-center">
                <AlertCircle className="h-8 w-8 text-rose-500 mb-4" />
                <p className="text-sm font-bold text-[#E8ECF4] mb-2">Target Sync Failed</p>
                <p className="text-xs italic mb-6">The operator was unable to retrieve details for this target. It may have been moved or archived.</p>
                <button 
                  onClick={() => onOpenChange(false)}
                  className="px-6 py-2 bg-[#1B2030] text-[#E8ECF4] rounded-lg text-xs font-bold hover:bg-[#2A3050]"
                >
                  Close Console
                </button>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
