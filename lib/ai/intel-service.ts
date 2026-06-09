import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy" });

/**
 * Generate AI summary using real filing text (Improvement #9)
 */
export async function generateAiSummary(filing: any, filingText?: string) {
  const company = filing.issuer?.name || filing.insiderName || "the company";
  const insider = filing.insiderName || "the reporting person";
  
  const textExcerpt = filingText 
    ? filingText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000)
    : null;
  
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "dummy") {
    try {
      const userPrompt = textExcerpt
        ? `Analyze a Form ${filing.formType} filing for ${company} by ${insider}. Has aged debt: ${filing.hasAgedDebt}. Has restricted shares: ${filing.hasRestricted}.\n\nFiling excerpt:\n${textExcerpt}\n\nBased on the filing text, provide a concise 2-sentence summary of the specific impact (mention actual dollar amounts, share counts, or counterparties if found), determine the sentiment (Bullish, Bearish, or Neutral), and assess the risk level (Low, Medium, High). Format as JSON: { "summary": "...", "sentiment": "...", "riskLevel": "..." }`
        : `Analyze a Form ${filing.formType} filing for ${company} by ${insider}. Has aged debt: ${filing.hasAgedDebt}. Has restricted shares: ${filing.hasRestricted}. Provide a concise 2-sentence summary, sentiment (Bullish/Bearish/Neutral), and risk level (Low/Medium/High). Format as JSON: { "summary": "...", "sentiment": "...", "riskLevel": "..." }`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a financial analyst specializing in SEC filings and OTC market insider transactions. When filing text is provided, extract specific details like dollar amounts, share counts, and counterparty names." },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      });
      const result = JSON.parse(completion.choices[0].message.content || "{}");
      return { ...result, confidence: textExcerpt ? 0.95 : 0.85 };
    } catch (e) {
      console.error("OpenAI Error:", e);
    }
  }

  return {
    summary: `Form ${filing.formType} filing for ${company} by ${insider}.${filing.hasAgedDebt ? " Aged/toxic debt notes detected." : ""}${filing.hasRestricted ? " Restricted share lots subject to Rule 144." : ""} Warrants deeper forensic review.`,
    sentiment: filing.hasAgedDebt ? "Bearish" : "Neutral",
    riskLevel: filing.hasAgedDebt || filing.hasRestricted ? "High" : "Low",
    confidence: 0.7
  };
}
