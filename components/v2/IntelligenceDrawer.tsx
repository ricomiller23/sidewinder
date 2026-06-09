"use client";

import React, { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { 
  Zap, Mail, Phone, Building2, User, Copy, Check, ShieldCheck, Clock, Network, Calendar, TrendingUp, ExternalLink, FileText, Loader2, Users
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { NetworkGraph } from "@/components/v2/NetworkGraph";
import { LiquidityCalendar } from "@/components/v2/LiquidityCalendar";
import { getReadableFilingUrl } from "@/lib/edgar/urls";

import { calculateRule144Date } from "@/lib/edgar/rule144";

export function IntelligenceDrawer({ 
  filing, 
  open, 
  onOpenChange 
}: { 
  filing: any, 
  open: boolean, 
  onOpenChange: (open: boolean) => void 
}) {
  const [loading, setLoading] = useState(false);
  const [intel, setIntel] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [relatedFilings, setRelatedFilings] = useState<unknown[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [rule144, setRule144] = useState<any>(null);
  const [filingText, setFilingText] = useState<string>("");
  const [loadingText, setLoadingText] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (open && filing) {
      setLoading(true);
      setIntel(null);
      setSelectedEntity(null);
      setRule144(null);
      setFilingText("");
      setLoadingText(true);
      setShowRaw(false);
      
      const targetCik = filing?.Insider?.cik || filing?.Issuer?.cik;
      const targetTicker = filing?.Issuer?.ticker;

      if (!targetCik) {
        setLoading(false);
        setLoadingText(false);
        return;
      }

      // 1. Calculate Rule 144
      try {
        const ruleData = calculateRule144Date(filing.filedAt, filing.Issuer?.marketTier);
        setRule144(ruleData);
      } catch (e) {
        console.error("Rule 144 Error:", e);
      }

      // 2. Fetch Intel & Content
      Promise.all([
        fetch(`/api/intel?cik=${targetCik}&ticker=${targetTicker || ""}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null),
        fetch(`/api/filings/${filing.id}/content`)
          .then(res => res.ok ? res.text() : "Filing content currently unavailable.")
          .catch(() => "Filing content currently unavailable.")
      ]).then(([intelData, textData]) => {
        setIntel((prev: any) => ({ ...prev, ...intelData }));
        setFilingText(textData || "Filing content currently unavailable.");
        
        // Background enrichment if phone is missing
        if (intelData && !intelData.contact?.phone) {
          fetch(`/api/contacts/enrich/${targetCik}`, { method: 'POST' }).catch(() => null);
        }
      })
      .then(() => {
        fetch(`/api/filings/${filing.id}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) setIntel((prev: any) => ({ ...prev, ...data }));
          })
          .catch(err => console.error("Drawer Fetch Error:", err))
          .finally(() => {
            setLoading(false);
            setLoadingText(false);
          });
      })
      .catch((err) => {
        console.error("Drawer Fetch Error:", err);
        setLoading(false);
        setLoadingText(false);
      });
    }
  }, [open, filing?.id]);

  const handleNodeClick = async (entity: any) => {
    setSelectedEntity(entity);
    setLoadingRelated(true);
    try {
      const res = await fetch(`/api/filings?cik=${entity.cik}&limit=5`);
      const data = await res.json();
      setRelatedFilings(data.data || []);
    } catch (e) {
      console.error(e);
      setRelatedFilings([]);
    } finally {
      setLoadingRelated(false);
    }
  };

  const copyToClipboard = (text: string | undefined, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const issuers = React.useMemo(() => 
    filing?.Issuer ? [{ name: filing.Issuer.name, cik: filing.Issuer.cik }] : [],
    [filing?.Issuer?.name, filing?.Issuer?.cik]
  );

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="bg-[#07080B] flex flex-col rounded-t-[32px] h-[92vh] mt-24 fixed bottom-0 left-0 right-0 z-[101] border-t border-[#1B2030] outline-none">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[#1B2030] my-4" />
          
          <div className="flex-1 overflow-y-auto px-6 pb-12 custom-scrollbar">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider">
                  {filing?.formType?.replace('FORM_', '') || "Filing"}
                </Badge>
                <span className="text-[10px] text-[#8892A6] font-mono">
                  ACC #{filing?.accessionNumber || "PENDING"}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#E8ECF4] leading-tight mb-2">
                {filing?.Insider?.fullName || filing?.insider?.fullName || filing?.Insider?.name || filing?.issuer?.name || "Unknown Entity"}
              </h2>
              <div className="flex items-center gap-4 text-[#8892A6] text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {filing?.filedAt ? new Date(filing.filedAt).toLocaleDateString() : "N/A"}
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {filing?.Issuer?.name || "Unknown Issuer"}
                </div>
                {intel?.contact?.title && (
                  <Badge variant="outline" className="h-5 bg-violet-500/10 text-violet-400 border-violet-500/20 text-[9px] uppercase">
                    {intel.contact.title}
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex mb-8">
              <a 
                href={getReadableFilingUrl(filing)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1B2030] text-[#E8ECF4] text-xs font-bold hover:bg-[#2A3050] transition-all border border-[#2A3050]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                SEC Primary Doc
              </a>
            </div>

            {/* Forensic Intel Summary */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-[#8892A6] uppercase tracking-widest flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                Forensic Analysis
              </h3>
              <div className="p-5 rounded-2xl bg-[#0F1218] border border-[#1B2030]">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-[#1B2030] rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-[#1B2030] rounded animate-pulse" />
                  </div>
                ) : intel?.summary ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {intel.summary.sentiment && (
                        <Badge className={
                          intel.summary.sentiment === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          intel.summary.sentiment === 'Bearish' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }>
                          <TrendingUp className="mr-1 h-3 w-3" />
                          {intel.summary.sentiment}
                        </Badge>
                      )}
                      {intel.summary.riskLevel && (
                        <Badge className={
                          intel.summary.riskLevel === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          intel.summary.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }>
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          {intel.summary.riskLevel} Risk
                        </Badge>
                      )}
                      {intel.summary.confidence && (
                        <Badge variant="outline" className="text-[#8892A6] border-[#1B2030] text-[10px]">
                          <Zap className="mr-1 h-3 w-3 text-amber-400" />
                          {Math.round(intel.summary.confidence * 100)}% Confidence
                        </Badge>
                      )}
                      {filing?.has3a10 && (
                        <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          Section 3(a)(10)
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#8892A6] leading-relaxed">
                      {typeof intel.summary === 'string' ? intel.summary : (intel.summary.summary || intel.summary.summary_text || "No analysis available.")}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#8892A6] italic">
                    Forensic summary unavailable for this filing.
                  </p>
                )}
              </div>
            </div>

            {/* Contact & Outreach */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-[#8892A6] uppercase tracking-widest flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-emerald-400" />
                Verified Operator Contacts
              </h3>
              
              {loading ? (
                <div className="h-20 bg-[#0F1218] rounded-xl animate-pulse" />
              ) : intel?.contact ? (
                <div className="space-y-3">
                  <div className="p-5 rounded-2xl bg-[#0F1218] border border-[#1B2030] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-[#8892A6] font-bold uppercase">Insider Email</p>
                          {intel.contact.isProjected && <Badge variant="outline" className="h-3 text-[7px] px-1 border-emerald-500/20 text-emerald-400">Forecasted</Badge>}
                        </div>
                        <p className="text-sm text-[#E8ECF4] font-medium truncate max-w-[200px]">{intel.contact.email || "N/A"}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(intel.contact.email, 'email')}
                      className="p-2 hover:bg-[#1B2030] rounded-lg transition-colors text-[#8892A6]"
                      disabled={!intel.contact.email}
                    >
                      {copied === 'email' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0F1218] border border-[#1B2030] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-cyan-400/10 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-[#8892A6] font-bold uppercase">Insider Phone</p>
                          {intel.contact.isProjected && <Badge variant="outline" className="h-3 text-[7px] px-1 border-cyan-500/20 text-cyan-400">Forecasted</Badge>}
                        </div>
                        <p className="text-sm text-[#E8ECF4] font-medium">{intel.contact.phone || "N/A"}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(intel.contact.phone, 'phone')}
                      className="p-2 hover:bg-[#1B2030] rounded-lg transition-colors text-[#8892A6]"
                      disabled={!intel.contact.phone}
                    >
                      {copied === 'phone' ? <Check className="h-4 w-4 text-cyan-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  {(filing?.Insider?.address1 || intel?.contact?.address1) && (
                    <div className="p-5 rounded-2xl bg-[#0F1218] border border-[#1B2030] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-violet-400/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-violet-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-[#8892A6] font-bold uppercase">Reporting Address</p>
                          <p className="text-sm text-[#E8ECF4] font-medium">
                            {filing?.Insider?.address1 || intel?.contact?.address1}
                            {(filing?.Insider?.address2 || intel?.contact?.address2) && `, ${filing?.Insider?.address2 || intel?.contact?.address2}`}
                          </p>
                          <p className="text-xs text-[#8892A6]">
                            {filing?.Insider?.city || intel?.contact?.city}, {filing?.Insider?.state || intel?.contact?.state} {filing?.Insider?.zip || intel?.contact?.zip}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const addr = `${filing?.Insider?.address1 || intel?.contact?.address1} ${filing?.Insider?.address2 || intel?.contact?.address2 || ""} ${filing?.Insider?.city || intel?.contact?.city} ${filing?.Insider?.state || intel?.contact?.state} ${filing?.Insider?.zip || intel?.contact?.zip}`;
                          copyToClipboard(addr, 'address');
                        }}
                        className="p-2 hover:bg-[#1B2030] rounded-lg transition-colors text-[#8892A6]"
                      >
                        {copied === 'address' ? <Check className="h-4 w-4 text-violet-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#0F1218] border border-[#1B2030] border-dashed text-center">
                  <p className="text-xs text-[#8892A6]">No contact intelligence found for this entity.</p>
                </div>
              )}
            </div>

            {/* Network Map */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-[#8892A6] uppercase tracking-widest flex items-center gap-2 mb-4">
                <Network className="h-4 w-4 text-emerald-400" />
                Insider Network Map
              </h3>
              <NetworkGraph 
                insiderName={filing?.Insider?.name || "Unknown"} 
                insiderCik={filing?.Insider?.cik}
                issuers={issuers}
                onNodeClick={handleNodeClick}
              />

              {selectedEntity && (
                <div className="mt-4 p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Shared Filing History: {selectedEntity.name}
                    </h4>
                    <button 
                      onClick={() => setSelectedEntity(null)}
                      className="text-[9px] text-[#8892A6] hover:text-[#E8ECF4] uppercase font-bold"
                    >
                      Close
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {loadingRelated ? (
                      <div className="h-10 w-full bg-cyan-400/5 rounded animate-pulse" />
                    ) : (relatedFilings && relatedFilings.length > 0) ? (
                      relatedFilings.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-[#07080B] border border-[#1B2030]">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[9px] px-1 h-4 bg-[#1B2030] text-[#8892A6] border-0">{f.formType}</Badge>
                            <span className="text-xs text-[#E8ECF4]">{new Date(f.filedAt).toLocaleDateString()}</span>
                          </div>
                          <ExternalLink className="h-3 w-3 text-[#8892A6]" />
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-[#8892A6] italic">No cross-filings found between these entities.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Outreach Templates */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-[#8892A6] uppercase tracking-widest flex items-center gap-2 mb-4">
                <Mail className="h-4 w-4 text-violet-400" />
                AI Outreach Templates
              </h3>
              <div className="p-5 rounded-2xl bg-[#0F1218] border border-violet-500/20">
                {loading ? (
                  <div className="h-24 w-full bg-violet-500/5 rounded-xl animate-pulse" />
                ) : intel?.outreach?.length > 0 ? (
                  <>
                    <p className="text-[10px] text-violet-400 font-bold mb-3 uppercase">
                      {intel.outreach[0].type} ANGLE
                    </p>
                    <div className="p-4 rounded-xl bg-[#07080B] border border-[#1B2030] mb-4">
                      <p className="text-sm text-[#8892A6] leading-relaxed italic">
                        "{intel.outreach[0].body}"
                      </p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(intel.outreach[0].body, "template")}
                      className="w-full py-3 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
                    >
                      {copied === "template" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      Copy Template
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-[#8892A6] italic text-center">No outreach templates generated for this filing.</p>
                )}
              </div>
            </div>

            {/* Rule 144 Calendar */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-[#8892A6] uppercase tracking-widest flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-rose-400" />
                Liquidity Event Forecast
              </h3>
              {filing?.hasRestricted ? (
                <LiquidityCalendar 
                  eligibilityDate={rule144?.formatted || "Calculating..."} 
                  shares={Number(filing?.RestrictedShareLot?.[0]?.shares || 0)} 
                  tier={filing?.Issuer?.marketTier || "OTCPK"} 
                />
              ) : (
                <div className="p-4 rounded-2xl bg-[#07080B] border border-[#1B2030] border-dashed text-center">
                  <p className="text-xs text-[#8892A6] italic">No restricted shares detected in this filing.</p>
                </div>
              )}
            </div>

          </div>

          <div className="p-6 bg-[#07080B] border-t border-[#1B2030] flex gap-3">
            <a 
              href={getReadableFilingUrl(filing)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-cyan-500 text-[#07080B] text-sm font-bold hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
            >
              <Building2 className="h-4 w-4" />
              Open HTML Filing
            </a>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
