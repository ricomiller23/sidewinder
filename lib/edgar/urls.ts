/**
 * Converts a raw SEC .txt filing URL into a more readable HTML/XSL rendered version.
 */
export function getReadableFilingUrl(filing: any) {
  if (!filing) return "#";

  // 1. Try to get CIK and Accession from the object
  // Prisma uses camelCase, database might have snake_case if raw query
  let cik = filing.cik || filing.Issuer?.cik || filing.issuer?.cik || filing.Insider?.cik || filing.insider?.cik || "";
  let accNo = filing.accessionNumber || filing.accession || "";
  let formType = (filing.formType || "").toString().toUpperCase();

  // 2. Parse from URLs if missing
  const baseUrl = filing.primaryDocUrl || filing.rawXmlUrl || filing.rawHtmlUrl || "";
  if (baseUrl && (cik === "" || accNo === "")) {
    // Matches: Archives/edgar/data/{CIK}/{ACC_CLEAN}/{ACC_OR_DOC}
    const match = baseUrl.match(/Archives\/edgar\/data\/(\d+)\/(\d+)\/([\d\w\.-]+)/);
    if (match) {
      cik = cik || match[1];
      if (!accNo) {
        const docPart = match[3];
        accNo = docPart.includes("-") ? docPart.replace(".txt", "") : match[2];
      }
    }
  }

  // Ensure CIK is 10 digits for SEC URLs (though sometimes they work with less)
  const paddedCik = cik ? cik.padStart(10, '0') : "";
  // Strip leading zeros for the data/CIK/ path if needed, but SEC usually accepts 10-digit
  // Actually, the example user gave uses 1885522 (7 digits). 
  // SEC URLs are flexible, but let's use the provided CIK as is if possible.
  const rawCik = String(cik || "").replace(/^0+/, ""); 

  if (rawCik && accNo) {
    const accNoClean = accNo.replace(/-/g, "");
    
    // The most robust way to link to an SEC filing is the index.html page.
    // Guessed XSL paths (like xslF345X03) are often wrong because:
    // 1. They can be X04, X05, X06, etc.
    // 2. They often require the Issuer's CIK even if the filing is under the Insider's CIK.
    // The index page handles all these redirections correctly.
    
    return `https://www.sec.gov/Archives/edgar/data/${rawCik}/${accNoClean}/${accNo.includes('-') ? accNo : accNoClean}-index.html`;
  }

  return baseUrl || "#";
}
