#!/usr/bin/env bun
/**
 * Check if agent is running and healthy
 */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8787";

console.log("🔍 Checking Agent Status");
console.log("━".repeat(60));
console.log(`Endpoint: ${API_BASE_URL}`);
console.log("");

// Check .well-known/agent.json
console.log("📡 Testing connection...");
const startTime = Date.now();

fetch(`${API_BASE_URL}/.well-known/agent.json`, {
  signal: AbortSignal.timeout(5000), // 5 second timeout
})
  .then(async (response) => {
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      console.error(`❌ Agent returned ${response.status} ${response.statusText}`);
      process.exit(1);
    }

    const data = await response.json();
    console.log(`✅ Agent is running! (${duration}ms)`);
    console.log("━".repeat(60));
    console.log(`Name: ${data.name}`);
    console.log(`Version: ${data.version}`);
    console.log(`Description: ${data.description || "N/A"}`);
    
    if (data.entrypoints && Array.isArray(data.entrypoints)) {
      console.log(`\n📍 Available Entrypoints:`);
      data.entrypoints.forEach((ep: any) => {
        console.log(`  - ${ep.path}`);
        if (ep.pricing) {
          console.log(`    Price: ${ep.pricing}`);
        }
      });
    }

    if (data.payments && Array.isArray(data.payments)) {
      console.log(`\n💰 Payment Methods:`);
      data.payments.forEach((pm: any) => {
        console.log(`  - Method: ${pm.method}`);
        console.log(`    Network: ${pm.network}`);
        console.log(`    Pay To: ${pm.payee}`);
      });
    }

    console.log("\n━".repeat(60));
    console.log("✅ Agent is healthy and ready to accept requests!");
  })
  .catch((error) => {
    const duration = Date.now() - startTime;
    console.error(`\n❌ Failed to connect to agent (${duration}ms)`);
    console.error(`Error: ${error.message}`);
    console.error("\nTroubleshooting:");
    console.error("  1. Is agent running? Run: bun run dev");
    console.error("  2. Check port in .env: PORT=8787");
    console.error("  3. Check firewall/network settings");
    console.error(`  4. Try: curl ${API_BASE_URL}/.well-known/agent.json`);
    process.exit(1);
  });

