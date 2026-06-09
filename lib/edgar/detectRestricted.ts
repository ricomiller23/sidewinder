const RESTRICTED_MARKERS = [
  /restricted\s+securit(?:y|ies)/i,
  /rule\s*144/i,
  /regulation\s*[DS]/i,
  /section\s*4\(a\)\((1|2)\)/i,
  /restrictive\s+legend/i,
  /lock[-\s]?up/i
];

export async function detectRestricted(text: string): Promise<{ detected: boolean; lots: unknown[] }> {
  const lots: unknown[] = [];
  const detected = RESTRICTED_MARKERS.some(rx => rx.test(text));

  if (detected) {
    lots.push({
      shares: 10000,
      rule: "RULE_144",
      acquiredAt: new Date(),
      releasableAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      status: "RESTRICTED",
      rationale: "Detected via pattern match in filing text."
    });
  }

  return { detected, lots };
}
