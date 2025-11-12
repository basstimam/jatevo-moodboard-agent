/**
 * Test file for getTopCoins tool
 * Run with: bun test
 */

import { describe, test, expect } from "bun:test";
import { getTopCoins } from "../src/tools/getTopCoins";

describe("getTopCoins", () => {
  test("should fetch top 10 coins successfully", async () => {
    const coins = await getTopCoins({ limit: 10, vs_currency: "usd" });

    expect(coins).toBeDefined();
    expect(Array.isArray(coins)).toBe(true);
    expect(coins.length).toBeLessThanOrEqual(10);

    if (coins.length > 0) {
      const firstCoin = coins[0];
      expect(firstCoin).toHaveProperty("symbol");
      expect(firstCoin).toHaveProperty("current_price");
      expect(firstCoin).toHaveProperty("market_cap");
      expect(firstCoin).toHaveProperty("market_cap_rank");
    }
  });

  test("should respect limit parameter", async () => {
    const coins = await getTopCoins({ limit: 5, vs_currency: "usd" });

    expect(coins.length).toBeLessThanOrEqual(5);
  });

  test("should handle API errors gracefully", async () => {
    // This test assumes the API might occasionally fail
    try {
      const coins = await getTopCoins({ limit: 10 });
      expect(Array.isArray(coins)).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Failed to fetch top coins");
    }
  });
});
