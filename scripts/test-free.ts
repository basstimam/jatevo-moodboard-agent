#!/usr/bin/env bun
/**
 * Test Agent WITHOUT Payment (Free Mode)
 *
 * This script tests the agent functionality without payment requirement.
 * Useful for testing agent logic without dealing with payment complexity.
 *
 * SETUP REQUIRED: Comment out payment config in src/agent.ts
 *
 * Usage:
 *   bun run scripts/test-free.ts
 */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8787";
const LIMIT = parseInt(process.env.LIMIT || "10");
const VS_CURRENCY = process.env.VS_CURRENCY || "usd";

const requestPayload = {
  limit: LIMIT,
  vs_currency: VS_CURRENCY,
};

const entrypointUrl = `${API_BASE_URL}/entrypoints/analyzeMoodboard/invoke`;

console.log("🆓 Market Moodboard Agent - Free Mode Test");
console.log("━".repeat(60));
console.log(`📍 Endpoint: ${entrypointUrl}`);
console.log(`📊 Request:`, JSON.stringify(requestPayload, null, 2));
console.log("━".repeat(60));

async function main() {
  console.log("\n📤 Making request (no payment)...");

  try {
    const response = await fetch(entrypointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.status === 402) {
      console.log("\n⚠️  Agent requires payment!");
      console.log("━".repeat(60));
      console.log("To test without payment:");
      console.log("1. Edit src/agent.ts");
      console.log("2. Comment out: config: configOverrides");
      console.log("3. Change to:");
      console.log('   createAgentApp({ name: "...", ... })');
      console.log("4. Restart: bun run dev");
      console.log("5. Retry: bun run test:free");
      console.log("━".repeat(60));
      console.log("\nSee PAYMENT_TESTING.md for details.");
      process.exit(1);
    }

    if (!response.ok) {
      console.error(`❌ Request failed: ${response.status}`);
      const errorBody = await response.text();
      console.error("Error:", errorBody);
      process.exit(1);
    }

    const result = await response.json();

    console.log("\n✅ Request successful!");
    console.log("━".repeat(60));

    console.log("\n📊 Market Moodboard Analysis");
    console.log("━".repeat(60));
    console.log(`📅 Date: ${result.output.date}`);
    console.log(`🤖 Model: ${result.model}`);
    console.log(`⏰ Analyzed at: ${result.output.analyzed_at}`);

    if (result.output.market_sentiment) {
      console.log(`\n💭 Market Sentiment:`);
      console.log(`   ${result.output.market_sentiment}`);
    }

    console.log(`\n🪙 Top ${result.output.coins.length} Coins Analysis:`);
    console.log("━".repeat(60));

    result.output.coins.forEach((coin: any, index: number) => {
      console.log(`\n${index + 1}. ${coin.symbol.toUpperCase()}`);
      console.log(`   Mood: ${coin.mood}`);
      console.log(`   Narrative: ${coin.narrative}`);
      console.log(`   Score: ${(coin.score * 100).toFixed(0)}%`);
      if (coin.price_change_24h !== undefined) {
        const arrow = coin.price_change_24h >= 0 ? "📈" : "📉";
        console.log(
          `   24h Change: ${arrow} ${coin.price_change_24h.toFixed(2)}%`
        );
      }
      if (coin.market_cap_rank) {
        console.log(`   Rank: #${coin.market_cap_rank}`);
      }
    });

    console.log("\n━".repeat(60));
    console.log("✅ Free mode test completed successfully!");
    console.log("💡 Agent is working without payment requirement");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
