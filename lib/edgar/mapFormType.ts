/**
 * Maps SEC filing type strings from the RSS feed to Prisma FormType enum values.
 */
export function mapFormType(filingType: string): string {
  const map: Record<string, string> = {
    "3": "F3", "3/A": "F3A", "4": "F4", "4/A": "F4A", "5": "F5",
    "S-1": "S1", "S-1/A": "S1A", "144": "F144", "8-K": "F8K",
    "DEF 14A": "DEF14A", "1-U": "F1U",
  };
  if (map[filingType]) return map[filingType];
  if (filingType.startsWith("SC 13D")) return "SC13D";
  if (filingType.startsWith("SC 13G")) return "SC13G";
  return "OTHER";
}
