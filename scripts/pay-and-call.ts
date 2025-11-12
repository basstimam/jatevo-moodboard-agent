#!/usr/bin/env bun
/**
 * Pay and Call Script for Market Moodboard Agent
 *
 * This script demonstrates the complete x402 payment flow using proper x402 libraries:
 * 1. Make initial request (gets 402 Payment Required)
 * 2. Sign payment with x402-fetch library
 * 3. Retry request with X-PAYMENT header
 * 4. Receive and display analysis results
 *
 * Usage:
 *   bun run scripts/pay-and-call.ts
 *
 * Environment variables:
 *   PRIVATE_KEY - Required for payment signing
 *   API_BASE_URL - Agent endpoint (default: http://localhost:8787)
 *   NETWORK - Payment network (default: base)
 *   LIMIT - Number of coins to analyze (default: 10)
 *   VS_CURRENCY - Currency for prices (default: usd)
 */

import { createPaymentHeader, selectPaymentRequirements } from "x402/client";
import { PaymentRequirementsSchema } from "x402/types";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8787";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const NETWORK = (process.env.NETWORK || "base") as any;
const LIMIT = parseInt(process.env.LIMIT || "10");
const VS_CURRENCY = process.env.VS_CURRENCY || "usd";

if (!PRIVATE_KEY) {
  console.error("❌ Error: PRIVATE_KEY environment variable is required");
  console.error("Set it in .env or run: PRIVATE_KEY=0x... bun run pay");
  process.exit(1);
}

// Request payload
const requestPayload = {
  limit: LIMIT,
  vs_currency: VS_CURRENCY,
};

const entrypointUrl = `${API_BASE_URL}/entrypoints/analyzeMoodboard/invoke`;

console.log("🚀 Market Moodboard Agent - Pay and Call Test");
console.log("━".repeat(60));
console.log(`📍 Endpoint: ${entrypointUrl}`);
console.log(`📊 Request:`, JSON.stringify(requestPayload, null, 2));
console.log("━".repeat(60));

async function main() {
  // Create wallet client from private key
  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  const chain = NETWORK === "base-sepolia" ? baseSepolia : base;
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  };

  // Step 1: Initial request (should return 402)
  console.log("\n📤 Step 1: Making initial request...");
  const initialResponse = await fetch(entrypointUrl, requestInit);
  const initialBody = await initialResponse.json();

  if (initialResponse.status !== 402) {
    console.error(
      `❌ Expected 402 Payment Required, got ${initialResponse.status}`,
    );
    console.error("Response:", initialBody);
    process.exit(1);
  }

  console.log("✅ Received 402 Payment Required");

  // Validate x402 response
  const { x402Version, accepts } = initialBody;
  if (!x402Version || !accepts || !Array.isArray(accepts)) {
    console.error("❌ Invalid x402 response format");
    process.exit(1);
  }

  // Parse payment requirements
  const requirements = accepts.map((entry: unknown) =>
    PaymentRequirementsSchema.parse(entry),
  );

  const firstRequirement = requirements[0];
  console.log("💰 Payment details:", {
    amount: firstRequirement.maxAmountRequired,
    network: firstRequirement.network,
    payTo: firstRequirement.payTo,
    asset: firstRequirement.asset,
  });

  // Step 2: Select requirements and create payment header
  console.log("\n🔐 Step 2: Creating payment header...");
  const selected = selectPaymentRequirements(requirements, NETWORK, "exact");
  const paymentHeader = await createPaymentHeader(
    walletClient,
    x402Version,
    selected,
  );

  console.log("✅ Payment header created");
  console.log(`📝 Payer: ${account.address}`);

  // Step 3: Retry with payment
  console.log("\n📤 Step 3: Retrying request with payment...");
  console.log("   ⏳ Waiting for agent response (max 90 seconds)...");
  const step3StartTime = Date.now();
  
  // Add timeout controller (90 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error("\n❌ Request timeout after 90 seconds");
    console.error("Possible causes:");
    console.error("  1. Agent not running (check: bun run dev)");
    console.error("  2. Agent crashed (check logs in dev terminal)");
    console.error("  3. CoinGecko API slow/failed");
    console.error("  4. Jatevo API timeout");
    controller.abort();
  }, 90000);
  
  let paidResponse;
  try {
    paidResponse = await fetch(entrypointUrl, {
      ...requestInit,
      headers: {
        ...(requestInit.headers || {}),
        "X-PAYMENT": paymentHeader,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (fetchError) {
    clearTimeout(timeoutId);
    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
      console.error("\n❌ Request was aborted due to timeout");
      process.exit(1);
    }
    throw fetchError;
  }

  const step3Duration = Date.now() - step3StartTime;
  console.log(`   ✅ Response received in ${step3Duration}ms`);
  console.log(`   Status: ${paidResponse.status} ${paidResponse.statusText}`);

  // Try to parse response
  let paidBody;
  const responseText = await paidResponse.text();
  
  try {
    paidBody = JSON.parse(responseText);
  } catch (parseError) {
    console.error(`❌ Failed to parse response as JSON`);
    console.error("Response text:", responseText.substring(0, 500));
    console.error("Parse error:", parseError);
    process.exit(1);
  }

  if (!paidResponse.ok) {
    console.error(`❌ Request failed with status ${paidResponse.status}`);
    console.error("Error:", paidBody);
    const paymentError = paidResponse.headers.get("x-payment-error");
    if (paymentError) {
      console.error("Payment Error:", paymentError);
    }
    process.exit(1);
  }

  // Step 4: Display results
  console.log("✅ Request successful!");
  console.log("━".repeat(60));

  console.log("\n📊 Market Moodboard Analysis");
  console.log("━".repeat(60));
  console.log(`📅 Date: ${paidBody.output.date}`);
  console.log(`🤖 Model: ${paidBody.model}`);
  console.log(`⏰ Analyzed at: ${paidBody.output.analyzed_at}`);

  // Check if raw response
  if (paidBody.raw || paidBody.output.raw_response) {
    console.log(`\n📝 Response from ${paidBody.output.model_used || paidBody.model}:`);
    console.log("━".repeat(60));
    
    // Show parsed data if available
    if (paidBody.output.parsed_data) {
      const parsed = paidBody.output.parsed_data;
      console.log(`\n💭 Market Sentiment: ${parsed.market_sentiment || "N/A"}`);
      console.log(`\n🪙 Top ${parsed.coins?.length || 0} Coins Analysis:`);
      console.log("━".repeat(60));
      
      parsed.coins?.forEach((coin: any, index: number) => {
        console.log(`\n${index + 1}. ${coin.symbol?.toUpperCase() || "N/A"}`);
        console.log(`   Mood: ${coin.mood || "N/A"}`);
        console.log(`   Narrative: ${coin.narrative || "N/A"}`);
        if (coin.score !== undefined) {
          console.log(`   Score: ${(coin.score * 100).toFixed(0)}%`);
        }
        if (coin.price_change_24h !== undefined) {
          const arrow = coin.price_change_24h >= 0 ? "📈" : "📉";
          console.log(`   24h Change: ${arrow} ${coin.price_change_24h.toFixed(2)}%`);
        }
        if (coin.market_cap_rank) {
          console.log(`   Rank: #${coin.market_cap_rank}`);
        }
      });
    } else {
      // Fallback: show raw response
      const rawResponse = paidBody.output.raw_response || "";
      console.log(rawResponse.substring(0, 2000));
      if (rawResponse.length > 2000) {
        console.log(`\n... (truncated, total length: ${rawResponse.length} chars)`);
      }
    }
  } else {
    // Parsed response format
    if (paidBody.output.market_sentiment) {
      console.log(`\n💭 Market Sentiment:`);
      console.log(`   ${paidBody.output.market_sentiment}`);
    }

    if (paidBody.output.coins && Array.isArray(paidBody.output.coins)) {
      console.log(`\n🪙 Top ${paidBody.output.coins.length} Coins Analysis:`);
      console.log("━".repeat(60));

      paidBody.output.coins.forEach((coin: any, index: number) => {
        console.log(`\n${index + 1}. ${coin.symbol?.toUpperCase() || "N/A"}`);
        console.log(`   Mood: ${coin.mood || "N/A"}`);
        console.log(`   Narrative: ${coin.narrative || "N/A"}`);
        if (coin.score !== undefined) {
          console.log(`   Score: ${(coin.score * 100).toFixed(0)}%`);
        }
        if (coin.price_change_24h !== undefined) {
          const arrow = coin.price_change_24h >= 0 ? "📈" : "📉";
          console.log(
            `   24h Change: ${arrow} ${coin.price_change_24h.toFixed(2)}%`,
          );
        }
        if (coin.market_cap_rank) {
          console.log(`   Rank: #${coin.market_cap_rank}`);
        }
      });
    }
  }

  console.log("\n━".repeat(60));
  console.log("✅ Test completed successfully!");
  console.log(`💵 Payment: 0.01 USDC processed on ${NETWORK} network`);
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
