// Mock data for the EDGAR Insider Scout dashboard
// This serves as realistic seed data until the SEC EDGAR pipeline is live.

export type MockFiling = {
  id: string;
  accessionNumber: string;
  formType: "F3" | "F4" | "F3A" | "F4A";
  filedAt: string;
  score: number;
  hasAgedDebt: boolean;
  hasRestricted: boolean;
  issuer: {
    cik: string;
    ticker: string;
    name: string;
    marketTier: string;
    avgDailyVolume: number;
  };
  insider: {
    cik: string;
    fullName: string;
    isOfficer: boolean;
    isDirector: boolean;
    officerTitle?: string;
    phone?: string;
    email?: string;
  };
  transactions: {
    securityTitle: string;
    transactionCode: string;
    shares: number;
    pricePerShare: number;
    acquiredDisposed: "A" | "D";
  }[];
};

export const mockFilings: MockFiling[] = [
  {
    id: "clx001",
    accessionNumber: "0001213900-26-012345",
    formType: "F4",
    filedAt: "2026-04-29T20:14:00Z",
    score: 92,
    hasAgedDebt: true,
    hasRestricted: true,
    issuer: {
      cik: "0001234567",
      ticker: "NDVA",
      name: "NovaDiamond Corp.",
      marketTier: "OTCQB",
      avgDailyVolume: 67800,
    },
    insider: {
      cik: "0009876543",
      fullName: "Reeves, Marcus T.",
      isOfficer: true,
      isDirector: true,
      officerTitle: "CEO & Chairman",
      phone: "+1-212-555-0142",
      email: "mreeves@novadiamond.com",
    },
    transactions: [
      { securityTitle: "Common Stock", transactionCode: "P", shares: 150000, pricePerShare: 0.0045, acquiredDisposed: "A" },
      { securityTitle: "Common Stock", transactionCode: "P", shares: 50000, pricePerShare: 0.005, acquiredDisposed: "A" },
    ],
  },
  {
    id: "clx002",
    accessionNumber: "0001213900-26-012390",
    formType: "F4",
    filedAt: "2026-04-28T16:30:00Z",
    score: 87,
    hasAgedDebt: true,
    hasRestricted: false,
    issuer: {
      cik: "0002345678",
      ticker: "QRCX",
      name: "QuantumReach Exploration Ltd.",
      marketTier: "OTCQX",
      avgDailyVolume: 124500,
    },
    insider: {
      cik: "0008765432",
      fullName: "Chen, Diana L.",
      isOfficer: true,
      isDirector: false,
      officerTitle: "CFO",
      phone: "+1-415-555-0398",
      email: "dchen@quantumreach.io",
    },
    transactions: [
      { securityTitle: "Series A Preferred", transactionCode: "A", shares: 500000, pricePerShare: 0.012, acquiredDisposed: "A" },
    ],
  },
  {
    id: "clx003",
    accessionNumber: "0001213900-26-012401",
    formType: "F3",
    filedAt: "2026-04-27T14:00:00Z",
    score: 78,
    hasAgedDebt: false,
    hasRestricted: true,
    issuer: {
      cik: "0003456789",
      ticker: "GBMN",
      name: "GreenBridge Minerals Inc.",
      marketTier: "PINK_CURRENT",
      avgDailyVolume: 38200,
    },
    insider: {
      cik: "0007654321",
      fullName: "Harlow, James W.",
      isOfficer: false,
      isDirector: true,
      phone: "+1-303-555-0277",
      email: "jharlow@gbminerals.com",
    },
    transactions: [
      { securityTitle: "Common Stock", transactionCode: "P", shares: 1000000, pricePerShare: 0.0023, acquiredDisposed: "A" },
    ],
  },
  {
    id: "clx004",
    accessionNumber: "0001213900-26-012422",
    formType: "F4",
    filedAt: "2026-04-26T11:45:00Z",
    score: 71,
    hasAgedDebt: false,
    hasRestricted: false,
    issuer: {
      cik: "0004567890",
      ticker: "ATVX",
      name: "ActiveVox Technologies",
      marketTier: "OTCQB",
      avgDailyVolume: 22100,
    },
    insider: {
      cik: "0006543210",
      fullName: "Okonkwo, Adaeze N.",
      isOfficer: true,
      isDirector: false,
      officerTitle: "VP of Operations",
      email: "aokonkwo@activevox.com",
    },
    transactions: [
      { securityTitle: "Common Stock", transactionCode: "S", shares: 75000, pricePerShare: 0.085, acquiredDisposed: "D" },
    ],
  },
  {
    id: "clx005",
    accessionNumber: "0001213900-26-012455",
    formType: "F4",
    filedAt: "2026-04-25T09:30:00Z",
    score: 65,
    hasAgedDebt: true,
    hasRestricted: false,
    issuer: {
      cik: "0005678901",
      ticker: "PMGX",
      name: "PrimGold Extraction Corp.",
      marketTier: "GREY",
      avgDailyVolume: 15800,
    },
    insider: {
      cik: "0005432109",
      fullName: "Rashid, Farid K.",
      isOfficer: false,
      isDirector: false,
      phone: "+1-786-555-0411",
    },
    transactions: [
      { securityTitle: "Common Stock", transactionCode: "P", shares: 2500000, pricePerShare: 0.001, acquiredDisposed: "A" },
    ],
  },
  {
    id: "clx006",
    accessionNumber: "0001213900-26-012488",
    formType: "F4",
    filedAt: "2026-04-24T15:10:00Z",
    score: 58,
    hasAgedDebt: false,
    hasRestricted: true,
    issuer: {
      cik: "0006789012",
      ticker: "SLKN",
      name: "SilkNet Biomedical Inc.",
      marketTier: "OTCQB",
      avgDailyVolume: 45900,
    },
    insider: {
      cik: "0004321098",
      fullName: "Vasquez, Elena R.",
      isOfficer: true,
      isDirector: true,
      officerTitle: "Chief Scientific Officer",
      email: "evasquez@silknetbio.com",
    },
    transactions: [
      { securityTitle: "Common Stock", transactionCode: "M", shares: 200000, pricePerShare: 0.032, acquiredDisposed: "A" },
    ],
  },
  {
    id: "clx007",
    accessionNumber: "0001213900-26-012510",
    formType: "F3",
    filedAt: "2026-04-23T12:00:00Z",
    score: 44,
    hasAgedDebt: false,
    hasRestricted: false,
    issuer: {
      cik: "0007890123",
      ticker: "CRVN",
      name: "Ceravan Holdings Group",
      marketTier: "PINK_LIMITED",
      avgDailyVolume: 18200,
    },
    insider: {
      cik: "0003210987",
      fullName: "Park, Soo-Jin",
      isOfficer: false,
      isDirector: false,
      email: "sjpark@ceravanholdings.com",
    },
    transactions: [
      { securityTitle: "Common Stock", transactionCode: "P", shares: 5000000, pricePerShare: 0.0008, acquiredDisposed: "A" },
    ],
  },
  {
    id: "clx008",
    accessionNumber: "0001213900-26-012533",
    formType: "F4",
    filedAt: "2026-04-22T17:20:00Z",
    score: 39,
    hasAgedDebt: false,
    hasRestricted: false,
    issuer: {
      cik: "0008901234",
      ticker: "NXGN",
      name: "NexGen Wireless Solutions",
      marketTier: "OTCQX",
      avgDailyVolume: 91300,
    },
    insider: {
      cik: "0002109876",
      fullName: "Brennan, Colin M.",
      isOfficer: true,
      isDirector: false,
      officerTitle: "CTO",
      phone: "+1-512-555-0633",
      email: "cbrennan@nexgenwireless.com",
    },
    transactions: [
      { securityTitle: "Common Stock", transactionCode: "F", shares: 30000, pricePerShare: 0.42, acquiredDisposed: "D" },
    ],
  },
];

export type MockAgedDebt = {
  id: string;
  issuerTicker: string;
  issuerName: string;
  noteType: string;
  principalUsd: number;
  interestRate: number;
  originationDate: string;
  maturityDate: string;
  ageDays: number;
  rationale: string;
};

export const mockAgedDebts: MockAgedDebt[] = [
  {
    id: "ad001",
    issuerTicker: "NDVA",
    issuerName: "NovaDiamond Corp.",
    noteType: "Convertible Note",
    principalUsd: 250000,
    interestRate: 12.0,
    originationDate: "2024-08-15",
    maturityDate: "2025-02-15",
    ageDays: 622,
    rationale: "Footnote F3 references a $250,000 convertible promissory note dated Aug 2024, past maturity with no evidence of repayment or conversion.",
  },
  {
    id: "ad002",
    issuerTicker: "QRCX",
    issuerName: "QuantumReach Exploration Ltd.",
    noteType: "Promissory Note",
    principalUsd: 1200000,
    interestRate: 8.0,
    originationDate: "2023-11-01",
    maturityDate: "2024-11-01",
    ageDays: 910,
    rationale: "10-Q filing discloses a $1.2M promissory note in default since Nov 2024. Accrued interest exceeds $120K.",
  },
  {
    id: "ad003",
    issuerTicker: "PMGX",
    issuerName: "PrimGold Extraction Corp.",
    noteType: "Accrued Compensation",
    principalUsd: 475000,
    interestRate: 0,
    originationDate: "2024-01-01",
    maturityDate: "2025-01-01",
    ageDays: 485,
    rationale: "Accrued officer compensation of $475K outstanding per 10-K annual report. No payment schedule disclosed.",
  },
];

export type MockRestrictedLot = {
  id: string;
  issuerTicker: string;
  issuerName: string;
  insiderName: string;
  shares: number;
  rule: string;
  acquiredAt: string;
  releasableAt: string;
  status: "RESTRICTED" | "ELIGIBLE_SOON" | "RELEASED";
  rationale: string;
};

export const mockRestrictedLots: MockRestrictedLot[] = [
  {
    id: "rs001",
    issuerTicker: "NDVA",
    issuerName: "NovaDiamond Corp.",
    insiderName: "Reeves, Marcus T.",
    shares: 5000000,
    rule: "Rule 144",
    acquiredAt: "2026-01-15",
    releasableAt: "2026-07-15",
    status: "ELIGIBLE_SOON",
    rationale: "5M restricted shares acquired via private placement. 6-month Rule 144 holding period ends July 2026.",
  },
  {
    id: "rs002",
    issuerTicker: "GBMN",
    issuerName: "GreenBridge Minerals Inc.",
    insiderName: "Harlow, James W.",
    shares: 2000000,
    rule: "Reg D",
    acquiredAt: "2025-10-01",
    releasableAt: "2026-10-01",
    status: "RESTRICTED",
    rationale: "2M shares issued under Reg D exemption with 12-month restriction. Restrictive legend confirmed in filing footnotes.",
  },
  {
    id: "rs003",
    issuerTicker: "SLKN",
    issuerName: "SilkNet Biomedical Inc.",
    insiderName: "Vasquez, Elena R.",
    shares: 800000,
    rule: "Rule 144",
    acquiredAt: "2025-08-01",
    releasableAt: "2026-02-01",
    status: "RELEASED",
    rationale: "800K shares acquired Aug 2025. Rule 144 holding period completed Feb 2026. Shares eligible for resale.",
  },
];

export const kpiData = {
  totalFilings: 1247,
  totalIssuers: 389,
  totalInsiders: 812,
  agedDebtFlags: 47,
  restrictedFlags: 93,
  avgScore: 62,
  filingsToday: 14,
  filingsThisWeek: 87,
};
