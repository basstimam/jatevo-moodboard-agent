/**
 * Configuration module for Market Moodboard Agent
 * Centralizes environment variable handling and validation
 */

export interface AgentConfig {
  // Server configuration
  port: number;
  apiBaseUrl: string;

  // Jatevo AI configuration
  jatevoApiKey: string;
  jatevoApiEndpoint: string;
  jatevoModel: string;

  // Payment configuration
  privateKey: string;
  facilitatorUrl: string;
  payTo: string;
  network: string;
  defaultPriceUsdc: string;

  // CoinGecko configuration
  coinGeckoBaseUrl: string;
}

/**
 * Convert USDC price to base units (USDC has 6 decimals)
 */
function usdcToBaseUnits(usdc: string | number): string {
  const usdcAmount = typeof usdc === "string" ? parseFloat(usdc) : usdc;
  return Math.floor(usdcAmount * 1_000_000).toString();
}

/**
 * Load and validate environment configuration
 */
export function loadConfig(): AgentConfig {
  // Required environment variables
  const privateKey = process.env.PRIVATE_KEY;
  const jatevoApiKey = process.env.JATEVO_API_KEY;

  if (!privateKey) {
    throw new Error(
      "PRIVATE_KEY is required. Please set it in your .env file.",
    );
  }

  if (!jatevoApiKey) {
    throw new Error(
      "JATEVO_API_KEY is required. Please set it in your .env file.",
    );
  }

  // Optional environment variables with defaults
  const defaultPriceUsdc = process.env.DEFAULT_PRICE_USDC || "0.01";

  return {
    // Server
    port: Number(process.env.PORT || 8787),
    apiBaseUrl: process.env.API_BASE_URL || "http://localhost:8787",

    // Jatevo AI
    jatevoApiKey,
    jatevoApiEndpoint:
      process.env.JATEVO_API_ENDPOINT ||
      "https://inference.jatevo.id/v1/chat/completions",
    jatevoModel: process.env.JATEVO_MODEL || "deepseek-ai/DeepSeek-R1-0528",

    // Payments
    privateKey,
    facilitatorUrl:
      process.env.FACILITATOR_URL || "https://facilitator.daydreams.systems",
    payTo:
      process.env.PAY_TO || "0xb308ed39d67D0d4BAe5BC2FAEF60c66BBb6AE429",
    network: process.env.NETWORK || "base",
    defaultPriceUsdc,

    // CoinGecko
    coinGeckoBaseUrl:
      process.env.COINGECKO_BASE_URL || "https://api.coingecko.com/api/v3",
  };
}

/**
 * Get default price in base units (for backward compatibility)
 */
export function getDefaultPrice(): string {
  const config = loadConfig();
  return (
    process.env.DEFAULT_PRICE || usdcToBaseUnits(config.defaultPriceUsdc)
  );
}

// Export singleton config instance
export const config = loadConfig();

