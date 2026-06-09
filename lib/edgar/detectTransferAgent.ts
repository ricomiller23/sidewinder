/**
 * Detect transfer agent mentions in SEC filing text.
 * (Improvement #10)
 */

const TA_PATTERNS = [
  /transfer\s+agent[:\s]+([A-Z][A-Za-z\s&,.']+?)(?:\.|,\s+(?:Inc|LLC|Corp|Ltd)|\n)/i,
  /(?:registered|shares\s+(?:are|were)\s+registered)\s+(?:by|with|through)\s+([A-Z][A-Za-z\s&,.']+?)(?:\.|,|\n)/i,
  /(?:Pacific|Continental|American|Equiniti|Computershare|Broadridge|EQ\s+Shareowner|Vstock\s+Transfer|Globex\s+Transfer|Securities\s+Transfer|Island\s+Stock\s+Transfer|Transhare)\s*(?:Stock\s+)?(?:Transfer|Trust)?(?:\s+(?:Company|Corp|Inc|LLC|Ltd))?/i,
];

export interface TransferAgentResult {
  detected: boolean;
  name: string | null;
}

export function detectTransferAgent(text: string): TransferAgentResult {
  if (!text) return { detected: false, name: null };

  for (const pattern of TA_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const name = (match[1] || match[0]).trim().replace(/[.,]+$/, '');
      return { detected: true, name };
    }
  }

  return { detected: false, name: null };
}
