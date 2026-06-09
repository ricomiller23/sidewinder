import { db } from "@/lib/db";
import { fetchLatestFilings, fetchFilingContent, parseEntryDetails } from "./fetchFilings";
import { computeCompositeScore, computeContactScores } from "./scoreFiling";
import { detectAgedDebt } from "./detectAgedDebt";
import { detectRestricted } from "./detectRestricted";
import { detect3a10 } from "./detect3a10";
import { extractAllInsiders } from "./extractInsiderData";
import { extractTransactions } from "./extractTransactions";
import { extract3a10Details } from "./extract3a10Details";
import { detectTransferAgent } from "./detectTransferAgent";
import { mapFormType } from "./mapFormType";

const ALLOWED_TYPES = new Set([
  "3", "4", "3/A", "4/A", "5", "144", "S-1", "S-1/A", "8-K", "DEF 14A", "1-U"
]);

function isAllowedType(type: string): boolean {
  return ALLOWED_TYPES.has(type) || type.startsWith("SC 13D") || type.startsWith("SC 13G");
}

export async function runDailyPoll() {
  console.log("[Sidewinder] Starting multi-feed poll...");

  // Update pipeline state
  const startedAt = new Date();

  const [general, f3, f4, f13d, f13g, f144] = await Promise.all([
    fetchLatestFilings(""),
    fetchLatestFilings("3"),
    fetchLatestFilings("4"),
    fetchLatestFilings("SC 13D"),
    fetchLatestFilings("SC 13G"),
    fetchLatestFilings("144"),
  ]);

  const allEntriesMap = new Map();
  [...general, ...f3, ...f4, ...f13d, ...f13g, ...f144].forEach(e => {
    const id = typeof e.id === "string" ? e.id : e.id?.["#text"] || "";
    if (id) allEntriesMap.set(id, e);
  });
  const entries = Array.from(allEntriesMap.values());
  console.log(`[Sidewinder] Fetched ${entries.length} unique entries`);

  const parsedEntries = entries
    .map(parseEntryDetails)
    .filter((e): e is NonNullable<typeof e> => e !== null && isAllowedType(e.type));

  let processed = 0;
  const errors: string[] = [];

  for (const filing of parsedEntries) {
    try {
      // 1. Upsert Issuer (single table — no more dual-write)
      const issuer = await db.issuer.upsert({
        where: { cik: filing.cik },
        update: { name: filing.companyName, lastFilingAt: filing.filedAt },
        create: {
          cik: filing.cik,
          name: filing.companyName,
          ticker: "",
          marketTier: "PINK_CURRENT",
        },
      });

      // 2. Fetch content & detect signals
      const content = await fetchFilingContent(filing.cik, filing.accNo);
      const [agedDebt, restricted, s3a10] = await Promise.all([
        detectAgedDebt(content),
        detectRestricted(content),
        detect3a10(content),
      ]);

      // 3. Detect transfer agent (#10)
      const ta = detectTransferAgent(content);
      if (ta.detected && ta.name) {
        await db.issuer.update({
          where: { id: issuer.id },
          data: { transferAgent: ta.name },
        });
      }

      // 4. Extract ALL insiders (#2)
      const allInsiders = extractAllInsiders(content);
      const primary = allInsiders[0];

      const score = computeCompositeScore({
        hasAgedDebt: agedDebt.detected,
        hasRestricted: restricted.detected,
        has3a10: s3a10.detected,
        adv30: issuer.avgDailyVolume || 0,
        marketTier: issuer.marketTier,
        isOfficerOrDirector: primary?.isDirector || primary?.isOfficer || false,
        isTenPctOwner: primary?.isTenPercentOwner || false,
        filedAt: filing.filedAt,
      });

      // 5. Create Filing
      const existing = await db.filing.findUnique({ where: { accessionNumber: filing.accNo } });
      if (existing) continue;

      const newFiling = await db.filing.create({
        data: {
          accessionNumber: filing.accNo,
          formType: mapFormType(filing.type) as any,
          filedAt: filing.filedAt,
          score,
          issuerId: issuer.id,
          insiderCik: primary?.cik || null,
          insiderName: primary?.name || null,
          rawXmlUrl: filing.link,
          rawHtmlUrl: filing.link,
          primaryDocUrl: filing.link,
          hasAgedDebt: agedDebt.detected,
          hasRestricted: restricted.detected,
          has3a10: s3a10.detected,
        },
      });

      // 6. Create insider links & contacts for ALL insiders (#2)
      for (const ins of allInsiders) {
        // Filing insider link
        await db.filingInsiderLink.upsert({
          where: { filingId_insiderCik: { filingId: newFiling.id, insiderCik: ins.cik } },
          update: {},
          create: {
            filingId: newFiling.id,
            insiderCik: ins.cik,
            insiderName: ins.name,
            isDirector: ins.isDirector || false,
            isOfficer: ins.isOfficer || false,
            isTenPctOwn: ins.isTenPercentOwner || false,
            officerTitle: ins.officerTitle,
          },
        });

        // Insider-issuer link
        await db.insiderIssuerLink.upsert({
          where: { insiderCik_issuerId: { insiderCik: ins.cik, issuerId: issuer.id } },
          update: { lastSeen: new Date(), insiderName: ins.name },
          create: {
            insiderCik: ins.cik,
            insiderName: ins.name,
            issuerId: issuer.id,
            isDirector: ins.isDirector || false,
            isOfficer: ins.isOfficer || false,
            isTenPctOwn: ins.isTenPercentOwner || false,
            officerTitle: ins.officerTitle,
          },
        });

        // Unified contact (no more dual Insider/contacts tables)
        const contactScores = computeContactScores({
          hasAgedDebt: agedDebt.detected,
          hasRestricted: restricted.detected,
          has3a10: s3a10.detected,
          adv30: issuer.avgDailyVolume || 0,
          marketTier: issuer.marketTier,
          isOfficerOrDirector: ins.isDirector || ins.isOfficer || false,
          isTenPctOwner: ins.isTenPercentOwner || false,
          filedAt: filing.filedAt,
          hasPhone: !!ins.phone,
          hasEmail: false,
          hasAddress: !!(ins.address1 || ins.city),
        });

        const existingContact = await db.contact.findFirst({
          where: { issuerId: issuer.id, cik: ins.cik },
        });

        if (existingContact) {
          await db.contact.update({
            where: { id: existingContact.id },
            data: {
              phone: ins.phone || undefined,
              address1: ins.address1 || undefined,
              city: ins.city || undefined,
              state: ins.state || undefined,
              thesisStrength: contactScores.thesis_strength_score,
              timingFreshness: contactScores.timing_freshness_score,
              tradabilityFit: contactScores.tradability_market_fit_score,
              outreachReadiness: contactScores.outreach_readiness_score,
              roleRelevance: contactScores.role_relevance_score,
              recordQuality: contactScores.record_quality_score,
              contactability: contactScores.contactability_score,
              thesisType: contactScores.thesis_type === 'both' ? 'BOTH' : contactScores.thesis_type === 'aged_debt' ? 'AGED_DEBT' : contactScores.thesis_type === 'restricted_block' ? 'RESTRICTED_BLOCK' : 'UNKNOWN',
            },
          });
        } else {
          await db.contact.create({
            data: {
              issuerId: issuer.id,
              cik: ins.cik,
              name: ins.name,
              normalizedName: ins.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
              phone: ins.phone,
              address1: ins.address1,
              city: ins.city,
              state: ins.state,
              zip: ins.zip,
              country: ins.country,
              contactType: ins.isDirector ? 'DIRECTOR' : ins.isOfficer ? 'OFFICER' : ins.isTenPercentOwner ? 'TEN_PCT_OWNER' : 'INSIDER',
              roleTitle: ins.officerTitle,
              thesisStrength: contactScores.thesis_strength_score,
              timingFreshness: contactScores.timing_freshness_score,
              tradabilityFit: contactScores.tradability_market_fit_score,
              outreachReadiness: contactScores.outreach_readiness_score,
              roleRelevance: contactScores.role_relevance_score,
              recordQuality: contactScores.record_quality_score,
              contactability: contactScores.contactability_score,
              thesisType: contactScores.thesis_type === 'both' ? 'BOTH' : contactScores.thesis_type === 'aged_debt' ? 'AGED_DEBT' : contactScores.thesis_type === 'restricted_block' ? 'RESTRICTED_BLOCK' : 'UNKNOWN',
            },
          });
        }
      }

      // 7. Extract & store transactions (#8)
      const formTypeStr = mapFormType(filing.type);
      if (['F3', 'F3A', 'F4', 'F4A', 'F5'].includes(formTypeStr)) {
        const transactions = extractTransactions(content);
        for (const tx of transactions) {
          await db.transaction.create({
            data: {
              filingId: newFiling.id,
              insiderCik: primary?.cik || filing.cik.padStart(10, '0'),
              tableType: tx.tableType,
              securityTitle: tx.securityTitle,
              transactionDate: tx.transactionDate,
              transactionCode: tx.transactionCode,
              shares: tx.shares,
              pricePerShare: tx.pricePerShare,
              acquiredDisposed: tx.acquiredDisposed,
              ownershipForm: tx.ownershipForm,
              sharesOwnedAfter: tx.sharesOwnedAfter,
              underlyingTitle: tx.underlyingTitle,
              underlyingShares: tx.underlyingShares,
              exercisePrice: tx.exercisePrice,
              exerciseDate: tx.exerciseDate,
              expirationDate: tx.expirationDate,
              footnoteIds: tx.footnoteIds,
            },
          });
        }
      }

      // 8. Store aged debt hits with real data (#1)
      if (agedDebt.detected) {
        for (const hit of agedDebt.hits) {
          await db.agedDebt.create({
            data: {
              issuerId: issuer.id,
              filingId: newFiling.id,
              source: "sec_filing",
              sourceUrl: filing.link,
              noteType: hit.matchedText,
              principalUsd: hit.principal || null,
              interestRate: hit.interestRate || null,
              originationDate: hit.originationDate,
              maturityDate: hit.maturityDate,
              ageDays: hit.ageDays,
              rationale: hit.rationale,
              matchedText: hit.matchedText,
            },
          });
        }
      }

      // 9. 3(a)(10) detail table
      if (s3a10.detected) {
        const details = extract3a10Details(content);
        await db.filing3a10.create({
          data: {
            filingId: newFiling.id,
            issuerId: issuer.id,
            companyName: filing.companyName,
            ticker: issuer.ticker || "",
            filingDate: filing.filedAt,
            transactionType: details.transactionType,
            securitiesBeingExchanged: details.securityType,
            valueOfSecurities: details.valueOfSecurities,
            numberOfShares: details.numberOfShares,
            courtApproval: details.courtApproval,
            securityType: details.securityType,
            sourceUrl: filing.link,
            extractedText: s3a10.hits.join("; "),
            confidenceScore: 95,
            identifiedContacts: allInsiders.map(i => ({ name: i.name, title: i.officerTitle || 'Insider' })),
          },
        });
      }

      processed++;
    } catch (err: any) {
      console.error(`[Sidewinder] Failed: ${filing.accNo}:`, err.message);
      errors.push(`${filing.accNo}: ${err.message}`);
    }
  }

  // Update pipeline state (#5)
  await db.pipelineState.upsert({
    where: { feedType: "daily_poll" },
    update: { lastPolledAt: startedAt, entriesFound: parsedEntries.length },
    create: { feedType: "daily_poll", lastPolledAt: startedAt, entriesFound: parsedEntries.length },
  });

  return { success: true, count: parsedEntries.length, processed, errors: errors.length > 0 ? errors : undefined };
}
