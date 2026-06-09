export interface InsiderExtractedData {
  cik: string;
  name: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
  isDirector?: boolean;
  isOfficer?: boolean;
  isTenPercentOwner?: boolean;
  isOther?: boolean;
  officerTitle?: string;
  otherText?: string;
}

/**
 * Extract ALL reporting owners from a filing.
 * Forms 3, 4, 5 can have multiple <reportingOwner> blocks.
 * Legacy header-based filings can have multiple REPORTING-OWNER sections.
 * 
 * Returns an array of all insiders found. Empty array if none detected.
 */
export function extractAllInsiders(content: string): InsiderExtractedData[] {
  const insiders: InsiderExtractedData[] = [];
  const seenCiks = new Set<string>();

  // 1. Try XML Tags (Forms 3, 4, 5) — extract ALL reportingOwner blocks
  const xmlBlockRegex = /<reportingOwner>([\s\S]*?)<\/reportingOwner>/gi;
  let xmlMatch;
  while ((xmlMatch = xmlBlockRegex.exec(content)) !== null) {
    const xmlBlock = xmlMatch[1];
    const rptOwnerCik = xmlBlock.match(/<rptOwnerCik>(\d+)<\/rptOwnerCik>/i)?.[1];
    const rptOwnerName = xmlBlock.match(/<rptOwnerName>(.*?)<\/rptOwnerName>/i)?.[1];

    if (rptOwnerCik && rptOwnerName) {
      const normalizedCik = rptOwnerCik.padStart(10, '0');
      if (seenCiks.has(normalizedCik)) continue; // Skip duplicates
      seenCiks.add(normalizedCik);

      insiders.push({
        cik: normalizedCik,
        name: rptOwnerName.replace(/&amp;/g, '&').replace(/&#\d+;/g, '').trim(),
        address1: xmlBlock.match(/<rptOwnerStreet1>(.*?)<\/rptOwnerStreet1>/i)?.[1]?.trim(),
        address2: xmlBlock.match(/<rptOwnerStreet2>(.*?)<\/rptOwnerStreet2>/i)?.[1]?.trim(),
        city: xmlBlock.match(/<rptOwnerCity>(.*?)<\/rptOwnerCity>/i)?.[1]?.trim(),
        state: xmlBlock.match(/<rptOwnerState>(.*?)<\/rptOwnerState>/i)?.[1]?.trim(),
        zip: xmlBlock.match(/<rptOwnerZipCode>(.*?)<\/rptOwnerZipCode>/i)?.[1]?.trim(),
        country: xmlBlock.match(/<rptOwnerStateDescription>(.*?)<\/rptOwnerStateDescription>/i)?.[1]?.trim(),
        phone: xmlBlock.match(/<rptOwnerPhone>(.*?)<\/rptOwnerPhone>/i)?.[1]?.trim(),
        isDirector: xmlBlock.match(/<isDirector>(1|true)<\/isDirector>/i) ? true : false,
        isOfficer: xmlBlock.match(/<isOfficer>(1|true)<\/isOfficer>/i) ? true : false,
        isTenPercentOwner: xmlBlock.match(/<isTenPercentOwner>(1|true)<\/isTenPercentOwner>/i) ? true : false,
        isOther: xmlBlock.match(/<isOther>(1|true)<\/isOther>/i) ? true : false,
        officerTitle: xmlBlock.match(/<officerTitle>(.*?)<\/officerTitle>/i)?.[1]?.trim(),
        otherText: xmlBlock.match(/<otherText>(.*?)<\/otherText>/i)?.[1]?.trim(),
      });
    }
  }

  if (insiders.length > 0) return insiders;

  // 2. Try Conformed Headers (Legacy or non-XML) — extract ALL REPORTING-OWNER sections
  const headerRegex = /REPORTING[- ]OWNER:([\s\S]*?)(?=REPORTING[- ]OWNER:|ISSUER:|SUBJECT COMPANY:|$)/gi;
  let headerMatch;
  while ((headerMatch = headerRegex.exec(content)) !== null) {
    const section = headerMatch[1];
    const cik = section.match(/CENTRAL INDEX KEY:\s+(\d+)/i)?.[1];
    const name = section.match(/COMPANY CONFORMED NAME:\s+(.*)/i)?.[1];

    if (cik && name) {
      const normalizedCik = cik.padStart(10, '0');
      if (seenCiks.has(normalizedCik)) continue;
      seenCiks.add(normalizedCik);

      const relationship = section.match(/RELATIONSHIP:\s+(.*)/i)?.[1] || "";
      
      insiders.push({
        cik: normalizedCik,
        name: name.trim(),
        address1: section.match(/STREET 1:\s+(.*)/i)?.[1]?.trim(),
        address2: section.match(/STREET 2:\s+(.*)/i)?.[1]?.trim(),
        city: section.match(/CITY:\s+(.*)/i)?.[1]?.trim(),
        state: section.match(/STATE:\s+(.*)/i)?.[1]?.trim(),
        zip: section.match(/ZIP:\s+(.*)/i)?.[1]?.trim(),
        phone: section.match(/BUSINESS PHONE:\s+(.*)/i)?.[1]?.trim(),
        isDirector: relationship.toLowerCase().includes("director"),
        isOfficer: relationship.toLowerCase().includes("officer") || relationship.toLowerCase().includes("ceo") || relationship.toLowerCase().includes("president"),
        isTenPercentOwner: relationship.toLowerCase().includes("10%"),
        officerTitle: relationship,
      });
    }
  }

  return insiders;
}

/**
 * Legacy single-insider extraction (backward compatible).
 * Returns the FIRST reporting owner found, or null if none.
 * 
 * @deprecated Use extractAllInsiders() for complete coverage.
 */
export function extractInsiderData(content: string): InsiderExtractedData | null {
  const all = extractAllInsiders(content);
  return all.length > 0 ? all[0] : null;
}
