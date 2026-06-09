import { differenceInDays } from 'date-fns';

export function computeCompositeScore(params: {
  hasAgedDebt: boolean;
  hasRestricted: boolean;
  has3a10?: boolean;
  adv30: number;
  marketTier: string;
  isOfficerOrDirector: boolean;
  isTenPctOwner: boolean;
  filedAt: Date;
}): number {
  const { hasAgedDebt, hasRestricted, has3a10, adv30, marketTier, isOfficerOrDirector, isTenPctOwner, filedAt } = params;

  let score = 0;

  score += hasAgedDebt ? 20 : 0;
  score += hasRestricted ? 20 : 0;
  score += has3a10 ? 25 : 0;
  score += 15 * (adv30 >= 50000 ? 1 : adv30 >= 15000 ? 0.5 : 0);

  const tierWeight = marketTier === 'OTCQX' ? 1.0 : marketTier === 'OTCQB' ? 0.8 : 0.5;
  score += 15 * tierWeight;

  const roleWeight = isOfficerOrDirector ? 1.0 : isTenPctOwner ? 0.8 : 0.5;
  score += 15 * roleWeight;

  const daysOld = differenceInDays(new Date(), filedAt);
  const recencyWeight = daysOld <= 7 ? 1.0 : daysOld <= 30 ? 0.5 : daysOld <= 90 ? 0.2 : 0;
  score += 15 * recencyWeight;

  return Math.min(100, Math.round(score));
}

export interface ContactScoresInput {
  hasAgedDebt: boolean;
  hasRestricted: boolean;
  has3a10?: boolean;
  adv30: number;
  marketTier: string;
  isOfficerOrDirector: boolean;
  isTenPctOwner: boolean;
  filedAt: Date;
  hasPhone: boolean;
  hasEmail: boolean;
  hasAddress: boolean;
}

export function computeContactScores(params: ContactScoresInput) {
  // Thesis type
  let thesis_type: 'aged_debt' | 'restricted_block' | 'both' | 'unknown' = 'unknown';
  if ((params.hasAgedDebt && params.hasRestricted) || (params.hasAgedDebt && params.has3a10)) {
    thesis_type = 'both';
  } else if (params.hasAgedDebt) {
    thesis_type = 'aged_debt';
  } else if (params.hasRestricted || params.has3a10) {
    thesis_type = 'restricted_block';
  }

  // 1. thesis_strength_score (between 0 and 20)
  let thesis_strength_score = 0;
  if (params.has3a10) thesis_strength_score = 20;
  else if (params.hasAgedDebt && params.hasRestricted) thesis_strength_score = 20;
  else if (params.hasAgedDebt || params.hasRestricted) thesis_strength_score = 15;

  // 2. timing_freshness_score (between 0 and 10)
  const daysOld = differenceInDays(new Date(), params.filedAt);
  const timing_freshness_score = daysOld <= 7 ? 10 : daysOld <= 30 ? 7 : daysOld <= 90 ? 3 : 0;

  // 3. tradability_market_fit_score (between 0 and 10)
  const volScore = params.adv30 >= 50000 ? 5 : params.adv30 >= 15000 ? 3 : 0;
  const tierScore = params.marketTier === 'OTCQX' ? 5 : params.marketTier === 'OTCQB' ? 4 : 2;
  const tradability_market_fit_score = Math.min(10, volScore + tierScore);

  // 4. outreach_readiness_score (between 0 and 10)
  const outreach_readiness_score = (params.hasPhone && params.hasEmail) ? 10 : 8;

  // 5. role_relevance_score (between 0 and 20)
  const role_relevance_score = params.isOfficerOrDirector ? 20 : params.isTenPctOwner ? 15 : 10;

  // 6. inventory_proximity_score (between 0 and 10)
  const inventory_proximity_score = 8;

  // 7. record_quality_score (between 0 and 5)
  let record_quality_score = 1;
  if (params.hasPhone) record_quality_score += 1;
  if (params.hasEmail) record_quality_score += 1;
  if (params.hasAddress) record_quality_score += 2;
  record_quality_score = Math.min(5, record_quality_score);

  // 8. contactability_score (between 0 and 5)
  let contactability_score = 1;
  if (params.hasEmail) contactability_score += 2;
  if (params.hasPhone) contactability_score += 2;
  contactability_score = Math.min(5, contactability_score);

  return {
    thesis_type,
    thesis_strength_score,
    timing_freshness_score,
    tradability_market_fit_score,
    outreach_readiness_score,
    role_relevance_score,
    inventory_proximity_score,
    record_quality_score,
    contactability_score,
  };
}

