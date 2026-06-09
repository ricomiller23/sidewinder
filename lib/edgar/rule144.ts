import { addMonths, format } from 'date-fns';

/**
 * Predicts the Rule 144 eligibility date based on filing date and issuer tier.
 * For reporting issuers, the holding period is typically 6 months.
 * For non-reporting issuers, it's 12 months.
 */
export function calculateRule144Date(filedAt: Date | string, marketTier: string) {
  const date = new Date(filedAt);
  
  // Pink Current usually means 6 months if reporting, but we'll assume 6 for this alpha.
  const months = (marketTier === 'PINK_LIMITED' || marketTier === 'GREY') ? 12 : 6;
  
  const eligibilityDate = addMonths(date, months);
  
  return {
    date: eligibilityDate,
    formatted: format(eligibilityDate, 'MMM dd, yyyy'),
    daysRemaining: Math.max(0, Math.floor((eligibilityDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
    monthsHolding: months
  };
}
