#!/usr/bin/env bun
/**
 * Simple Test Script for Market Moodboard Agent
 *
 * This script tests the agent endpoint without payment (expects 402)
 * Useful for checking agent availability and payment mandate structure
 *
 * Usage:
 *   bun run scripts/test-agent.ts
 *
 * Environment variables:
 *   API_BASE_URL - Agent endpoint (default: http://localhost:8787)
 */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8787";
const LIMIT = parseInt(process.env.LIMIT || "10");
const VS_CURRENCY = process.env.VS_CURRENCY || "usd";

const requestPayload = {
  limit: LIMIT,
  vs_currency: VS_CURRENCY,
};

console.log("🧪 Market Moodboard Agent - Simple Test");
console.log("━".repeat(60));

async function main() {
  // Test 1: Check agent manifest
  console.log("\n📋 Test 1: Checking agent manifest...");
  try {
    const manifestUrl = `${API_BASE_URL}/.well-known/agent.json`;
    const manifestResponse = await fetch(manifestUrl);

    if (!manifestResponse.ok) {
      console.error(`❌ Failed to fetch manifest: ${manifestResponse.status}`);
      process.exit(1);
    }

    const manifest = await manifestResponse.json();
    console.log("✅ Agent manifest retrieved");
    console.log(`   Name: ${manifest.name}`);
    console.log(`   Version: ${manifest.version}`);
    console.log(`   Description: ${manifest.description}`);

    if (manifest.entrypoints?.analyzeMoodboard) {
      console.log(`   Entrypoint: analyzeMoodboard`);
      console.log(`   Price: ${manifest.entrypoints.analyzeMoodboard.pricing?.invoke} base units`);
    }
  } catch (error) {
    console.error("❌ Error fetching manifest:", error);
    process.exit(1);
  }

  // Test 2: Make unpaid request (expect 402)
  console.log("\n📤 Test 2: Making request without payment...");
  const entrypointUrl = `${API_BASE_URL}/entrypoints/analyzeMoodboard/invoke`;
  console.log(`   Endpoint: ${entrypointUrl}`);
  console.log(`   Payload:`, requestPayload);

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
      console.log("✅ Received expected 402 Payment Required");

      const paymentMandate = await response.json();

      if (paymentMandate.accepts && paymentMandate.accepts.length > 0) {
        const mandate = paymentMandate.accepts[0];
        console.log("\n💰 Payment Mandate Details:");
        console.log(`   Amount: ${mandate.maxAmountRequired} base units (0.01 USDC)`);
        console.log(`   Network: ${mandate.network}`);
        console.log(`   Pay To: ${mandate.payTo}`);
        console.log(`   Asset: ${mandate.asset}`);
        console.log(`   Resource: ${mandate.resource}`);
      }

      console.log("\n✅ Agent is configured correctly for x402 payments!");
      console.log("💡 To make paid requests, use: bun run pay");
    } else if (response.status === 200) {
      console.log("⚠️  Warning: Request succeeded without payment");
      console.log("   This might indicate payment is disabled");
    } else {
      console.error(`❌ Unexpected status: ${response.status}`);
      const body = await response.text();
      console.error("   Response:", body);
    }
  } catch (error) {
    console.error("❌ Error making request:", error);
    process.exit(1);
  }

  console.log("\n━".repeat(60));
  console.log("✅ Test completed!");
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
