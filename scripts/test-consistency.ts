#!/usr/bin/env bun
/**
 * Test Market Moodboard Agent consistency - Run 5 consecutive tests
 * 
 * Usage:
 *   bun run scripts/test-consistency.ts
 */

import { createPaymentHeader, selectPaymentRequirements } from "x402/client";
import { PaymentRequirementsSchema } from "x402/types";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8787";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const NETWORK = (process.env.NETWORK || "base") as any;
const LIMIT = parseInt(process.env.LIMIT || "10");
const VS_CURRENCY = process.env.VS_CURRENCY || "usd";

if (!PRIVATE_KEY) {
  console.error("❌ Error: PRIVATE_KEY environment variable is required");
  process.exit(1);
}

interface TestResult {
  attempt: number;
  success: boolean;
  status: number;
  hasRawResponse?: boolean;
  validated?: boolean;
  responseTime: number;
  error?: string;
}

const entrypointUrl = `${API_BASE_URL}/entrypoints/analyzeMoodboard/invoke`;
const requestPayload = { limit: LIMIT, vs_currency: VS_CURRENCY };

async function runSingleTest(attempt: number): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Create wallet client
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    const chain = NETWORK === "base-sepolia" ? baseSepolia : base;
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(),
    });

    const requestInit: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    };

    // Step 1: Initial request (402)
    const initialResponse = await fetch(entrypointUrl, requestInit);
    const initialBody = await initialResponse.json();

    if (initialResponse.status !== 402) {
      return {
        attempt,
        success: false,
        status: initialResponse.status,
        responseTime: Date.now() - startTime,
        error: `Expected 402, got ${initialResponse.status}`,
      };
    }

    // Step 2: Create payment header
    const { x402Version, accepts } = initialBody;
    const requirements = accepts.map((entry: unknown) =>
      PaymentRequirementsSchema.parse(entry),
    );
    const selected = selectPaymentRequirements(requirements, NETWORK, "exact");
    const paymentHeader = await createPaymentHeader(
      walletClient,
      x402Version,
      selected,
    );

    // Step 3: Retry with payment
    const paidResponse = await fetch(entrypointUrl, {
      ...requestInit,
      headers: {
        ...(requestInit.headers || {}),
        "X-PAYMENT": paymentHeader,
      },
    });

    const responseTime = Date.now() - startTime;
    const responseText = await paidResponse.text();
    let paidBody: any;

    try {
      paidBody = JSON.parse(responseText);
    } catch (parseError) {
      return {
        attempt,
        success: false,
        status: paidResponse.status,
        responseTime,
        error: "Failed to parse response as JSON",
      };
    }

    if (!paidResponse.ok) {
      return {
        attempt,
        success: false,
        status: paidResponse.status,
        responseTime,
        error: paidBody.error?.message || "Request failed",
      };
    }

    // Check if raw response was returned
    const hasRawResponse = paidBody.raw === true || paidBody.output?.raw_response !== undefined;
    const validated = !hasRawResponse && paidBody.validated !== false;

    return {
      attempt,
      success: true,
      status: 200,
      hasRawResponse,
      validated,
      responseTime,
    };
  } catch (error) {
    return {
      attempt,
      success: false,
      status: 0,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function runConsistencyTest() {
  console.log("🧪 Market Moodboard Agent - Consistency Test");
  console.log("━".repeat(60));
  console.log(`📍 Endpoint: ${entrypointUrl}`);
  console.log(`📊 Request: ${JSON.stringify(requestPayload)}`);
  console.log(`🔄 Running 5 consecutive tests...\n`);

  const results: TestResult[] = [];

  for (let i = 1; i <= 5; i++) {
    console.log(`📤 Test ${i}/5...`);
    const result = await runSingleTest(i);
    results.push(result);

    if (result.success) {
      const statusIcon = result.validated ? "✅" : "⚠️";
      console.log(`   ${statusIcon} Success (${result.responseTime}ms)`);
      if (result.hasRawResponse) {
        console.log(`   ⚠️  Raw response returned (parsing failed)`);
      } else if (result.validated === false) {
        console.log(`   ⚠️  Unvalidated response (schema check failed)`);
      }
    } else {
      console.log(`   ❌ Failed: ${result.error || `Status ${result.status}`}`);
    }

    // Wait 1 second between requests
    if (i < 5) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log("\n" + "━".repeat(60));
  console.log("📊 Test Summary");
  console.log("━".repeat(60));

  const successCount = results.filter((r) => r.success).length;
  const validatedCount = results.filter((r) => r.success && r.validated !== false).length;
  const rawResponseCount = results.filter((r) => r.hasRawResponse).length;
  const avgResponseTime =
    results
      .filter((r) => r.responseTime > 0)
      .reduce((sum, r) => sum + r.responseTime, 0) / successCount || 0;

  console.log(`✅ Successful requests: ${successCount}/5 (${(successCount / 5) * 100}%)`);
  console.log(`✅ Validated responses: ${validatedCount}/5 (${(validatedCount / 5) * 100}%)`);
  console.log(`⚠️  Raw responses (parsing failed): ${rawResponseCount}/5`);
  console.log(`⏱️  Average response time: ${avgResponseTime.toFixed(0)}ms`);

  // Detailed breakdown
  console.log("\n📋 Detailed Results:");
  results.forEach((r) => {
    if (r.success) {
      const icon = r.validated ? "✅" : r.hasRawResponse ? "⚠️" : "⚠️";
      console.log(`   ${icon} Test ${r.attempt}: ${r.responseTime}ms - ${r.validated ? "Validated" : r.hasRawResponse ? "Raw response" : "Unvalidated"}`);
    } else {
      console.log(`   ❌ Test ${r.attempt}: Failed - ${r.error || `Status ${r.status}`}`);
    }
  });

  console.log("\n" + "━".repeat(60));

  if (successCount === 5 && validatedCount === 5) {
    console.log("🎉 All tests passed! Agent is consistent.");
    process.exit(0);
  } else if (successCount === 5 && rawResponseCount > 0) {
    console.log("⚠️  All requests succeeded but some returned raw responses.");
    console.log("   Consider improving prompt or JSON parsing.");
    process.exit(1);
  } else {
    console.log("❌ Some tests failed. Check errors above.");
    process.exit(1);
  }
}

runConsistencyTest().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
