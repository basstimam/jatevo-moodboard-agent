#!/usr/bin/env bun
/**
 * Test Jatevo API with full agent-like prompt
 */

const JATEVO_API_KEY = process.env.JATEVO_API_KEY;
const JATEVO_MODEL = process.env.JATEVO_MODEL || "zai-glm-4.6";
const JATEVO_ENDPOINT = "https://inference.jatevo.id/v1/chat/completions";

if (!JATEVO_API_KEY) {
  console.error("❌ JATEVO_API_KEY not set");
  process.exit(1);
}

// Simulate CoinGecko data summary
const mockCoinsSummary = `BTC: $95000.00, 24h change: -1.50%, Market Cap Rank: #1
ETH: $3200.00, 24h change: -2.80%, Market Cap Rank: #2
USDT: $1.00, 24h change: 0.00%, Market Cap Rank: #3
XRP: $0.75, 24h change: -2.75%, Market Cap Rank: #4
BNB: $610.00, 24h change: -2.50%, Market Cap Rank: #5
SOL: $180.00, 24h change: -5.30%, Market Cap Rank: #6
USDC: $1.00, 24h change: 0.00%, Market Cap Rank: #7
STETH: $3180.00, 24h change: -2.75%, Market Cap Rank: #8
TRX: $0.25, 24h change: 1.20%, Market Cap Rank: #9
DOGE: $0.35, 24h change: -3.00%, Market Cap Rank: #10`;

const currentDate = new Date().toISOString().split("T")[0];
const currentTimestamp = new Date().toISOString();

const prompt = `Analyze the cryptocurrency market data below. You MUST return valid JSON ONLY.

Market Data (10 coins):
${mockCoinsSummary}

EXAMPLE CORRECT RESPONSE (single line, no pretty print):
{"date":"${currentDate}","coins":[{"symbol":"BTC","mood":"📉","narrative":"bearish decline","score":0.65,"price_change_24h":-2.09,"market_cap_rank":1},{"symbol":"ETH","mood":"📉","narrative":"following BTC","score":0.70,"price_change_24h":-3.19,"market_cap_rank":2},{"symbol":"USDT","mood":"😐","narrative":"stable peg","score":0.95,"price_change_24h":0.00,"market_cap_rank":3}],"market_sentiment":"Market showing broad correction with major coins declining","analyzed_at":"${currentTimestamp}"}

YOUR TASK:
1. Analyze ALL 10 coins from the data above
2. Use moods: 🚀 (very bullish), 📈 (bullish), 😐 (neutral), 📉 (bearish), 🔴 (very bearish)
3. Narrative: 2-3 words maximum
4. Score: number 0.0 to 1.0
5. Use actual price_change_24h and market_cap_rank from the data
6. Return JSON in SINGLE LINE format like the example
7. NO markdown, NO explanation, ONLY the JSON object`;

console.log("🧪 Testing Jatevo API with Full Agent Prompt");
console.log("━".repeat(60));
console.log(`Model: ${JATEVO_MODEL}`);
console.log(`Prompt length: ${prompt.length} chars`);
console.log("");

const requestBody = {
  model: JATEVO_MODEL,
  messages: [
    {
      role: "system",
      content:
        "You are a JSON-only API. Your response must be valid JSON only. No markdown code blocks, no explanations, no text before or after. Return ONLY the JSON object.",
    },
    {
      role: "user",
      content: prompt,
    },
  ],
  stop: [],
  stream: false,
  top_p: 1,
  max_tokens: 2000,
  temperature: 0.2,
  presence_penalty: 0,
  frequency_penalty: 0,
};

console.log("📤 Sending request...");
console.log(`Request size: ${JSON.stringify(requestBody).length} bytes`);
console.log("");

const startTime = Date.now();

fetch(JATEVO_ENDPOINT, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${JATEVO_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(requestBody),
})
  .then(async (response) => {
    const duration = Date.now() - startTime;
    console.log(`✅ Response received in ${duration}ms`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log("");

    const responseText = await response.text();
    console.log(`Response size: ${responseText.length} bytes`);
    console.log("");

    try {
      const data = JSON.parse(responseText);

      if ("error" in data) {
        console.error("❌ API Error:");
        console.error(JSON.stringify(data.error, null, 2));
        process.exit(1);
      }

      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        console.log("📝 Content extracted:");
        console.log(`Length: ${content.length} chars`);
        console.log("━".repeat(60));
        console.log(content);
        console.log("━".repeat(60));

        if (content.length === 0) {
          console.error("\n❌ Content is EMPTY!");
          console.error("This is why agent stuck at step 3");
          process.exit(1);
        } else {
          console.log("\n✅ Content received successfully!");
          
          // Try to parse as JSON
          try {
            const cleaned = content
              .replace(/```json\s*/g, "")
              .replace(/```\s*/g, "")
              .trim();
            const parsed = JSON.parse(cleaned);
            console.log("\n✅ Content is valid JSON!");
            console.log("Parsed:", JSON.stringify(parsed, null, 2));
          } catch (parseError) {
            console.warn("\n⚠️ Content is NOT valid JSON");
            console.warn("Parse error:", parseError);
          }
        }
      } else {
        console.error("❌ No choices in response");
        process.exit(1);
      }
    } catch (parseError) {
      console.error("❌ Failed to parse response");
      console.error(parseError);
      console.error("\nRaw response:");
      console.error(responseText);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("❌ Request failed:");
    console.error(error);
    process.exit(1);
  });

