/**
 * Extract transactions from Form 3/4/5 XML filings.
 * Parses <nonDerivativeTable> and <derivativeTable> blocks.
 * (Improvement #8 — Transaction-Level Analysis)
 */

export interface TransactionData {
  tableType: 'NON_DERIVATIVE' | 'DERIVATIVE';
  securityTitle: string;
  transactionDate: Date | null;
  transactionCode: string | null;
  shares: number | null;
  pricePerShare: number | null;
  acquiredDisposed: string | null;
  ownershipForm: string | null;
  sharesOwnedAfter: number | null;
  underlyingTitle: string | null;
  underlyingShares: number | null;
  exercisePrice: number | null;
  exerciseDate: Date | null;
  expirationDate: Date | null;
  footnoteIds: string[];
}

function parseDate(text: string | undefined): Date | null {
  if (!text) return null;
  const d = new Date(text.trim());
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(text: string | undefined): number | null {
  if (!text) return null;
  const n = parseFloat(text.replace(/,/g, '').trim());
  return isNaN(n) ? null : n;
}

function extractTag(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1]?.trim();
}

function extractFootnoteIds(xml: string): string[] {
  const ids: string[] = [];
  const matches = xml.matchAll(/footnoteId\s+id="([^"]+)"/gi);
  for (const m of matches) ids.push(m[1]);
  return ids;
}

export function extractTransactions(content: string): TransactionData[] {
  const transactions: TransactionData[] = [];

  // Non-derivative transactions
  const ndTableMatch = content.match(/<nonDerivativeTable>([\s\S]*?)<\/nonDerivativeTable>/i);
  if (ndTableMatch) {
    const ndTransactions = ndTableMatch[1].matchAll(/<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/gi);
    for (const txMatch of ndTransactions) {
      const tx = txMatch[1];
      transactions.push({
        tableType: 'NON_DERIVATIVE',
        securityTitle: extractTag(tx, 'securityTitle')?.replace(/<value>(.*?)<\/value>/i, '$1') || 'Unknown',
        transactionDate: parseDate(extractTag(tx, 'transactionDate')?.replace(/<value>(.*?)<\/value>/i, '$1')),
        transactionCode: extractTag(tx, 'transactionCode')?.replace(/<value>(.*?)<\/value>/i, '$1') || null,
        shares: parseNumber(extractTag(tx, 'transactionShares')?.replace(/<value>(.*?)<\/value>/i, '$1')),
        pricePerShare: parseNumber(extractTag(tx, 'transactionPricePerShare')?.replace(/<value>(.*?)<\/value>/i, '$1')),
        acquiredDisposed: extractTag(tx, 'transactionAcquiredDisposedCode')?.replace(/<value>(.*?)<\/value>/i, '$1') || null,
        ownershipForm: extractTag(tx, 'directOrIndirectOwnership')?.replace(/<value>(.*?)<\/value>/i, '$1') || null,
        sharesOwnedAfter: parseNumber(extractTag(tx, 'sharesOwnedFollowingTransaction')?.replace(/<value>(.*?)<\/value>/i, '$1')),
        underlyingTitle: null,
        underlyingShares: null,
        exercisePrice: null,
        exerciseDate: null,
        expirationDate: null,
        footnoteIds: extractFootnoteIds(tx),
      });
    }

    // Non-derivative holdings (Form 3 style)
    const ndHoldings = ndTableMatch[1].matchAll(/<nonDerivativeHolding>([\s\S]*?)<\/nonDerivativeHolding>/gi);
    for (const hMatch of ndHoldings) {
      const h = hMatch[1];
      transactions.push({
        tableType: 'NON_DERIVATIVE',
        securityTitle: extractTag(h, 'securityTitle')?.replace(/<value>(.*?)<\/value>/i, '$1') || 'Unknown',
        transactionDate: null,
        transactionCode: 'H', // Holding
        shares: null,
        pricePerShare: null,
        acquiredDisposed: null,
        ownershipForm: extractTag(h, 'directOrIndirectOwnership')?.replace(/<value>(.*?)<\/value>/i, '$1') || null,
        sharesOwnedAfter: parseNumber(extractTag(h, 'sharesOwnedFollowingTransaction')?.replace(/<value>(.*?)<\/value>/i, '$1')),
        underlyingTitle: null,
        underlyingShares: null,
        exercisePrice: null,
        exerciseDate: null,
        expirationDate: null,
        footnoteIds: extractFootnoteIds(h),
      });
    }
  }

  // Derivative transactions
  const dTableMatch = content.match(/<derivativeTable>([\s\S]*?)<\/derivativeTable>/i);
  if (dTableMatch) {
    const dTransactions = dTableMatch[1].matchAll(/<derivativeTransaction>([\s\S]*?)<\/derivativeTransaction>/gi);
    for (const txMatch of dTransactions) {
      const tx = txMatch[1];
      transactions.push({
        tableType: 'DERIVATIVE',
        securityTitle: extractTag(tx, 'securityTitle')?.replace(/<value>(.*?)<\/value>/i, '$1') || 'Unknown',
        transactionDate: parseDate(extractTag(tx, 'transactionDate')?.replace(/<value>(.*?)<\/value>/i, '$1')),
        transactionCode: extractTag(tx, 'transactionCode')?.replace(/<value>(.*?)<\/value>/i, '$1') || null,
        shares: parseNumber(extractTag(tx, 'transactionShares')?.replace(/<value>(.*?)<\/value>/i, '$1')),
        pricePerShare: parseNumber(extractTag(tx, 'transactionPricePerShare')?.replace(/<value>(.*?)<\/value>/i, '$1')),
        acquiredDisposed: extractTag(tx, 'transactionAcquiredDisposedCode')?.replace(/<value>(.*?)<\/value>/i, '$1') || null,
        ownershipForm: extractTag(tx, 'directOrIndirectOwnership')?.replace(/<value>(.*?)<\/value>/i, '$1') || null,
        sharesOwnedAfter: parseNumber(extractTag(tx, 'sharesOwnedFollowingTransaction')?.replace(/<value>(.*?)<\/value>/i, '$1')),
        underlyingTitle: extractTag(tx, 'underlyingSecurity')?.match(/<securityTitle>[\s\S]*?<value>(.*?)<\/value>/i)?.[1] || null,
        underlyingShares: parseNumber(extractTag(tx, 'underlyingSecurity')?.match(/<underlyingSecurityShares>[\s\S]*?<value>(.*?)<\/value>/i)?.[1]),
        exercisePrice: parseNumber(extractTag(tx, 'conversionOrExercisePrice')?.replace(/<value>(.*?)<\/value>/i, '$1')),
        exerciseDate: parseDate(extractTag(tx, 'exerciseDate')?.replace(/<value>(.*?)<\/value>/i, '$1')),
        expirationDate: parseDate(extractTag(tx, 'expirationDate')?.replace(/<value>(.*?)<\/value>/i, '$1')),
        footnoteIds: extractFootnoteIds(tx),
      });
    }
  }

  return transactions;
}
