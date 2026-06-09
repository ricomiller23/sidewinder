import { differenceInDays } from 'date-fns';

const DEBT_PATTERNS = [
  /convertible\s+(?:promissory\s+)?note/i,
  /promissory\s+note/i,
  /accrued\s+(?:interest|liabilities|compensation)/i,
  /(?:default(?:ed)?|past\s+due|matured)\s+(?:note|loan|obligation)/i,
  /toxic\s+(?:debt|note|financing)/i,
  /death\s+spiral\s+(?:note|financing|convertible)/i,
  /variable\s+rate\s+(?:note|convertible)/i,
];

export interface AgedDebtHit {
  ageDays: number;
  principal: number;
  interestRate: number | null;
  originationDate: Date | null;
  maturityDate: Date | null;
  rationale: string;
  matchedText: string;
}

/**
 * Extract real dollar amounts from filing text near debt-related patterns.
 */
function extractPrincipalAmount(text: string, matchIndex: number): number {
  // Look in a window around the match for dollar amounts
  const windowStart = Math.max(0, matchIndex - 500);
  const windowEnd = Math.min(text.length, matchIndex + 500);
  const window = text.slice(windowStart, windowEnd);

  // Match dollar amounts: $50,000 or $1,000,000.00 or $500,000
  const dollarMatches = [...window.matchAll(/\$\s*([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)/g)];
  
  if (dollarMatches.length === 0) return 0;

  // Pick the largest amount found near the match (likely the principal)
  let maxAmount = 0;
  for (const m of dollarMatches) {
    const amount = parseFloat(m[1].replace(/,/g, ''));
    if (amount > maxAmount && amount < 1_000_000_000) { // Sanity cap at $1B
      maxAmount = amount;
    }
  }
  return maxAmount;
}

/**
 * Extract interest rate from text near a match.
 */
function extractInterestRate(text: string, matchIndex: number): number | null {
  const windowStart = Math.max(0, matchIndex - 300);
  const windowEnd = Math.min(text.length, matchIndex + 300);
  const window = text.slice(windowStart, windowEnd);

  // Match patterns like "8% interest", "interest rate of 10%", "12.5% per annum"
  const rateMatch = window.match(
    /(?:(?:interest\s+(?:rate\s+)?(?:of\s+)?)|(?:bearing\s+interest\s+at\s+))(\d{1,2}(?:\.\d{1,2})?)\s*%/i
  ) || window.match(
    /(\d{1,2}(?:\.\d{1,2})?)\s*%\s*(?:interest|per\s+annum|annually)/i
  );

  if (rateMatch) {
    const rate = parseFloat(rateMatch[1]);
    if (rate > 0 && rate < 100) return rate;
  }
  return null;
}

/**
 * Extract date from text near a match (origination or maturity).
 */
function extractDate(text: string, matchIndex: number, keyword: string): Date | null {
  const windowStart = Math.max(0, matchIndex - 400);
  const windowEnd = Math.min(text.length, matchIndex + 400);
  const window = text.slice(windowStart, windowEnd);

  // Look for dates near the keyword
  const keywordIdx = window.toLowerCase().indexOf(keyword.toLowerCase());
  if (keywordIdx === -1) return null;

  const nearDate = window.slice(Math.max(0, keywordIdx - 100), keywordIdx + 200);

  // Match common date formats: January 15, 2024 | 01/15/2024 | 2024-01-15
  const datePatterns = [
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
    /\d{1,2}\/\d{1,2}\/\d{4}/,
    /\d{4}-\d{2}-\d{2}/,
  ];

  for (const pattern of datePatterns) {
    const dateMatch = nearDate.match(pattern);
    if (dateMatch) {
      const parsed = new Date(dateMatch[0]);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }
  return null;
}

export async function detectAgedDebt(text: string): Promise<{ detected: boolean; hits: AgedDebtHit[] }> {
  const hits: AgedDebtHit[] = [];
  
  if (!text) return { detected: false, hits };

  for (const pattern of DEBT_PATTERNS) {
    const matches = [...text.matchAll(new RegExp(pattern, 'gi'))];
    
    for (const match of matches) {
      const matchIndex = match.index ?? 0;
      const matchedText = match[0];

      const principal = extractPrincipalAmount(text, matchIndex);
      const interestRate = extractInterestRate(text, matchIndex);
      const originationDate = extractDate(text, matchIndex, 'dated') 
        || extractDate(text, matchIndex, 'issued')
        || extractDate(text, matchIndex, 'origination');
      const maturityDate = extractDate(text, matchIndex, 'matur')
        || extractDate(text, matchIndex, 'due date')
        || extractDate(text, matchIndex, 'expir');

      // Calculate age from origination date or maturity date
      let ageDays = 0;
      if (originationDate) {
        ageDays = differenceInDays(new Date(), originationDate);
      } else if (maturityDate && maturityDate < new Date()) {
        // If matured and past due, calculate from maturity
        ageDays = differenceInDays(new Date(), maturityDate);
      }

      // Build rationale
      const rationale = buildRationale(matchedText, principal, interestRate, originationDate, maturityDate, ageDays);

      // Avoid duplicate hits for the same match text at nearly the same location
      const isDuplicate = hits.some(h => 
        h.matchedText === matchedText && Math.abs(h.ageDays - ageDays) < 5 && Math.abs(h.principal - principal) < 100
      );

      if (!isDuplicate) {
        hits.push({
          ageDays: Math.max(ageDays, 0),
          principal,
          interestRate,
          originationDate,
          maturityDate,
          rationale,
          matchedText,
        });
      }
    }
  }

  return { 
    detected: hits.length > 0, 
    hits 
  };
}

function buildRationale(
  matchedText: string, 
  principal: number, 
  interestRate: number | null,
  originationDate: Date | null, 
  maturityDate: Date | null, 
  ageDays: number
): string {
  const parts: string[] = [`Detected "${matchedText}" in filing text.`];
  
  if (principal > 0) {
    parts.push(`Principal: $${principal.toLocaleString()}.`);
  }
  if (interestRate !== null) {
    parts.push(`Interest rate: ${interestRate}%.`);
  }
  if (originationDate) {
    parts.push(`Originated: ${originationDate.toLocaleDateString()}.`);
  }
  if (maturityDate) {
    parts.push(`Maturity: ${maturityDate.toLocaleDateString()}.`);
  }
  if (ageDays > 0) {
    parts.push(`Estimated age: ${ageDays} days.`);
  }
  if (principal === 0 && !originationDate && !maturityDate) {
    parts.push('Unable to extract specific financial details from surrounding text.');
  }

  return parts.join(' ');
}
