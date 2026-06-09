/**
 * Detects mentions of Section 3(a)(10) of the Securities Act of 1933.
 * This exemption is often used in court-approved settlements, mergers, or recapitalizations.
 */

const PATTERNS = [
  /Section\s+3\(a\)\(10\)/i,
  /3\(a\)\(10\)\s+exemption/i,
  /exemption\s+from\s+registration\s+pursuant\s+to\s+Section\s+3\(a\)\(10\)/i,
  /fairness\s+hearing/i,
  /3a10\s+filing/i,
  /3\(a\)a\(10\)/i // Including user's specific typo just in case
];

export async function detect3a10(text: string): Promise<{ detected: boolean; hits: string[] }> {
  const hits: string[] = [];
  
  if (!text) return { detected: false, hits };

  for (const pattern of PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      hits.push(match[0]);
    }
  }

  return {
    detected: hits.length > 0,
    hits
  };
}
