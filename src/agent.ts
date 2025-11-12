import { z } from "zod";
import { createAgentApp, AgentKitConfig } from "@lucid-dreams/agent-kit";
import type { AgentMeta, EntrypointDef } from "@lucid-dreams/agent-kit";
import { getTopCoins } from "./tools/getTopCoins";
import { callGLM46 } from "./services/jatevoClient";
import { moodboardOutputSchema } from "./schemas/outputSchema";
import { config, getDefaultPrice } from "./config";

/**
 * Market Moodboard Agent
 * Analyzes top 10 crypto coins by market cap and determines market mood/narrative
 * using Jatevo AI models (default: zai-glm-4.6)
 *
 * Required environment variables:
 *   - JATEVO_API_KEY   (required for model inference)
 *   - PRIVATE_KEY      (required for x402 payments)
 * Optional environment variables:
 *   - JATEVO_MODEL     (model name, default: zai-glm-4.6)
 */

// x402 payment configuration
const configOverrides: AgentKitConfig = {
  payments: {
    facilitatorUrl: config.facilitatorUrl as any,
    payTo: config.payTo as `0x${string}`,
    network: config.network as any,
    defaultPrice: getDefaultPrice(),
  },
};

const agentMeta: AgentMeta = {
  name: "Market Moodboard Agent",
  version: "0.0.1",
  description:
    "Analyzes top 10 coins by market cap to determine mood and narrative using Jatevo AI models",
};

const { app, addEntrypoint, payments } = createAgentApp(agentMeta, {
  config: configOverrides,
  useConfigPayments: true,
});

// Main entrypoint for moodboard analysis
addEntrypoint({
  key: "analyzeMoodboard",
  description:
    "Fetch top coins from CoinGecko and analyze market mood using Jatevo AI",
  price: "0.01 USDC",
  input: z.object({
    limit: z
      .number()
      .min(1)
      .max(50)
      .optional()
      .default(10)
      .describe("Number of top coins to analyze (default: 10)"),
    vs_currency: z
      .string()
      .optional()
      .default("usd")
      .describe("Currency for price data (default: usd)"),
  }),
  output: moodboardOutputSchema,
  async handler(ctx) {
    const { limit, vs_currency } = ctx.input;

    try {
      // Step 1: Fetch top coins from CoinGecko
      console.log(`Fetching top ${limit} coins from CoinGecko...`);
      const coins = await getTopCoins({ limit, vs_currency });

      if (!coins || coins.length === 0) {
        throw new Error("No coin data received from CoinGecko");
      }

      console.log(`Retrieved ${coins.length} coins`);

      // Step 2: Prepare data for Jatevo AI analysis
      const coinsSummary = coins
        .map(
          (coin) =>
            `${coin.symbol.toUpperCase()}: $${coin.current_price.toFixed(2)}, 24h change: ${coin.price_change_percentage_24h?.toFixed(2)}%, Market Cap Rank: #${coin.market_cap_rank}`,
        )
        .join("\n");

      const currentDate = new Date().toISOString().split("T")[0];
      const currentTimestamp = new Date().toISOString();
      
      const prompt = `Analyze the cryptocurrency market data below. You MUST return valid JSON ONLY.

Market Data (${limit} coins):
${coinsSummary}

EXAMPLE CORRECT RESPONSE (single line, no pretty print):
{"date":"${currentDate}","coins":[{"symbol":"BTC","mood":"📉","narrative":"bearish decline","score":0.65,"price_change_24h":-2.09,"market_cap_rank":1},{"symbol":"ETH","mood":"📉","narrative":"following BTC","score":0.70,"price_change_24h":-3.19,"market_cap_rank":2},{"symbol":"USDT","mood":"😐","narrative":"stable peg","score":0.95,"price_change_24h":0.00,"market_cap_rank":3}],"market_sentiment":"Market showing broad correction with major coins declining","analyzed_at":"${currentTimestamp}"}

YOUR TASK:
1. Analyze ALL ${limit} coins from the data above
2. Use moods: 🚀 (very bullish), 📈 (bullish), 😐 (neutral), 📉 (bearish), 🔴 (very bearish)
3. Narrative: 2-3 words maximum
4. Score: number 0.0 to 1.0
5. Use actual price_change_24h and market_cap_rank from the data
6. Return JSON in SINGLE LINE format like the example
7. NO markdown, NO explanation, ONLY the JSON object`;

      // Step 3: Call Jatevo AI for analysis
      const analysisStartTime = Date.now();
      console.log(`\n[Agent] Step 3: Sending data to ${config.jatevoModel} for analysis...`);
      console.log(`[Agent] Prompt length: ${prompt.length} chars`);
      
      const response = await callGLM46(
        prompt,
        config.jatevoApiKey,
        config.jatevoModel,
      );

      const analysisDuration = Date.now() - analysisStartTime;
      console.log(`\n[Agent] Analysis completed in ${analysisDuration}ms`);
      console.log(`[Agent] Content extracted from ${config.jatevoModel} response`);
      console.log(`[Agent] Content length: ${response.length} chars`);
      console.log(`[Agent] Full content (raw response from choices[0].message.content):`);
      console.log("━".repeat(60));
      console.log(response);
      console.log("━".repeat(60));

      // Step 4: Parse response and fix date
      console.log(`\n[Agent] ✅ Processing GLM response`);
      console.log(`[Agent] Current date: ${currentDate} (real-time)`);
      console.log(`[Agent] Current timestamp: ${currentTimestamp} (real-time)`);

      // Try to parse and fix date
      let parsedResponse = null;
      let correctedResponse = response;

      try {
        // Clean and parse
        const cleaned = response
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();
        
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
          
          // Fix date to real-time
          if (parsedResponse.date) {
            parsedResponse.date = currentDate;
          }
          if (parsedResponse.analyzed_at) {
            parsedResponse.analyzed_at = currentTimestamp;
          }
          
          correctedResponse = JSON.stringify(parsedResponse);
          console.log(`[Agent] ✅ Parsed and corrected date to ${currentDate}`);
        }
      } catch (parseError) {
        console.warn(`[Agent] ⚠️ Could not parse response, returning raw`);
      }

      return {
        output: {
          date: currentDate,
          analyzed_at: currentTimestamp,
          raw_response: response,
          corrected_response: correctedResponse,
          parsed_data: parsedResponse,
          model_used: config.jatevoModel,
          analysis_duration_ms: analysisDuration,
        },
        model: config.jatevoModel,
        raw: true,
      };
    } catch (error) {
      console.error("Error in moodboard analysis:", error);

      if (error instanceof Error) {
        throw new Error(`Moodboard analysis failed: ${error.message}`);
      }
      throw new Error("Moodboard analysis failed: Unknown error");
    }
  },
});

export { app, agentMeta, payments };
