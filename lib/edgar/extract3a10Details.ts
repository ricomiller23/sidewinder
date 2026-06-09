/**
 * Shared utility to extract structured details from 3(a)(10) filing text.
 * Previously duplicated in both ingestion.ts and inngest/functions.ts.
 */

export interface Extract3a10Result {
  transactionType: string;
  valueOfSecurities: number;
  numberOfShares: number;
  courtApproval: boolean;
  securityType: string;
}

export function extract3a10Details(text: string): Extract3a10Result {
  let transactionType = "debt_settlement";
  if (text.match(/merger|acquisition/i)) {
    transactionType = "merger_consideration";
  } else if (text.match(/exchange/i)) {
    transactionType = "stock_exchange";
  }

  let valueOfSecurities = 0;
  const valueMatch = text.match(/\$\s*([0-9,]+(\.[0-9]{2})?)/);
  if (valueMatch) {
    valueOfSecurities = parseFloat(valueMatch[1].replace(/,/g, ""));
  }

  let numberOfShares = 0;
  const sharesMatch = text.match(/([0-9,]+)\s+shares/i);
  if (sharesMatch) {
    numberOfShares = parseFloat(sharesMatch[1].replace(/,/g, ""));
  }

  const courtApproval = text.match(/court\s+(approved|approval|order)|fairness\s+hearing/i) !== null;

  let securityType = "Common_Stock";
  if (text.match(/preferred\s+stock/i)) {
    securityType = "Preferred_Stock";
  } else if (text.match(/convertible\s+note/i)) {
    securityType = "Convertible_Notes";
  } else if (text.match(/warrant/i)) {
    securityType = "Warrants";
  } else if (text.match(/debt|note|loan/i)) {
    securityType = "Debt";
  }

  return {
    transactionType,
    valueOfSecurities,
    numberOfShares,
    courtApproval,
    securityType,
  };
}
