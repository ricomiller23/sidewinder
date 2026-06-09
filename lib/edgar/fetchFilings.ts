import { XMLParser } from "fast-xml-parser";

const RSS_URL = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=&company=&dateb=&owner=include&start=0&count=100&output=atom";

export interface EdgarEntry {
  title: string;
  link: string;
  summary: string;
  updated: string;
  id: string;
}

export async function fetchLatestFilings(typeFilter: string = ""): Promise<EdgarEntry[]> {
  const RSS_URL = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=${typeFilter}&company=&dateb=&owner=include&start=0&count=100&output=atom`;
  console.log(`[fetchLatestFilings] Fetching: ${RSS_URL}`);
  try {
    const response = await fetch(RSS_URL, {
      cache: 'no-store', // CRITICAL: Disable Next.js caching
      headers: {
        "User-Agent": process.env.SEC_USER_AGENT || "Antigravity Research (eric@ricomiller.com) (Individual)",
        "Accept-Encoding": "gzip, deflate",
        "Host": "www.sec.gov"
      },
    });

    if (!response.ok) {
      throw new Error(`SEC RSS fetch failed: ${response.statusText}`);
    }

    const xmlData = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const result = parser.parse(xmlData);

    const entries = result.feed?.entry || [];
    return Array.isArray(entries) ? entries : [entries];
  } catch (error) {
    console.error("[fetchLatestFilings]", error);
    return [];
  }
}

export function parseEntryDetails(entry: any) {
  const title = typeof entry.title === "string" ? entry.title : entry.title?.["#text"] || "";
  const summary = typeof entry.summary === "string" ? entry.summary : entry.summary?.["#text"] || "";
  const link = typeof entry.link === "string" ? entry.link : entry.link?.["@_href"] || "";

  const titleMatch = title.match(/^([A-Za-z0-9\-\/\s]+?) - (.*?) \((\d+)\)/);
  if (!titleMatch) return null;

  let [_, type, companyName, cik] = titleMatch;
  type = type.trim();


  
  const accNoMatch = summary.match(/Acc No:<\/b> ([\d-]+)/);
  const accNo = accNoMatch ? accNoMatch[1] : entry.id?.split("=").pop() || "";

  const accNoClean = accNo.replace(/-/g, "");
  const fullTextUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoClean}/${accNo}.txt`;
  const landingPageUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoClean}/${accNo}-index.html`;

  let primaryDocUrl = landingPageUrl;

  return {
    type,
    companyName,
    cik,
    accNo,
    link: landingPageUrl, // Primary link is now the "easy to read" version
    rawXmlUrl: landingPageUrl, // Force readable version site-wide
    landingPageUrl,
    filedAt: new Date(entry.updated),
  };
}
export async function fetchFilingContent(cik: string, accNo: string): Promise<string> {
  const accNoClean = accNo.replace(/-/g, "");
  const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoClean}/${accNo}.txt`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        "User-Agent": process.env.SEC_USER_AGENT || "EDGAR Insider Scout contact@yourdomain.com",
      },
    });

    if (!response.ok) {
      throw new Error(`SEC Filing fetch failed (${url}): ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error("[fetchFilingContent]", error);
    return "";
  }
}
