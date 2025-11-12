#!/usr/bin/env bun
/**
 * Self-Payment Test
 * Test payment flow where you pay yourself (no money lost, just gas)
 *
 * This script helps you understand the payment flow without losing money
 *
 * Usage:
 *   PRIVATE_KEY=0x... bun run scripts/test-self-payment.ts
 */

import { privateKeyToAccount } from "viem/accounts";
import { type Hex } from "viem";

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;

if (!PRIVATE_KEY) {
  console.error("❌ Error: PRIVATE_KEY environment variable is required");
  console.error("Usage: PRIVATE_KEY=0x... bun run scripts/test-self-payment.ts");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);

console.log("🔐 Self-Payment Test Configuration");
console.log("━".repeat(60));
console.log("\n📊 Your Configuration:");
console.log(`   Your Wallet Address: ${account.address}`);
console.log("\n✅ Recommended .env settings for self-test:");
console.log("━".repeat(60));
console.log(`PRIVATE_KEY=${PRIVATE_KEY}`);
console.log(`PAY_TO=${account.address}  # 👈 Pay to yourself!`);
console.log(`DEFAULT_PRICE_USDC=0.01`);
console.log(`NETWORK=base`);
console.log("━".repeat(60));

console.log("\n💰 Money Flow (Self-Payment):");
console.log("━".repeat(60));
console.log(`   FROM: ${account.address} (Your wallet)`);
console.log(`   TO:   ${account.address} (Same wallet!)`);
console.log(`   AMOUNT: 0.01 USDC`);
console.log("\n💡 Net Effect:");
console.log(`   Before: 1.000 USDC`);
console.log(`   Payment: -0.01 USDC (to yourself)`);
console.log(`   Gas fee: -0.001 USDC (to network)`);
console.log(`   After: ~0.999 USDC`);
console.log("\n   ✅ You only lose gas fee (~$0.001)!`");
console.log("━".repeat(60));

console.log("\n🎯 Next Steps:");
console.log("━".repeat(60));
console.log("1. Copy the PAY_TO line above to your .env");
console.log("2. Start agent: bun run dev");
console.log("3. Run test: bun run pay");
console.log("━".repeat(60));

console.log("\n📚 For more info, see: PAYMENT_FLOW.md");
