import { z } from "zod";

/**
 * Zod schema for validating Market Moodboard Agent output
 */

export const coinMoodSchema = z.object({
  symbol: z.string().min(1).describe("Coin symbol (e.g., BTC, ETH)"),
  mood: z.string().min(1).describe("Mood indicator (emoji or text)"),
  narrative: z
    .string()
    .min(1)
    .describe("Market narrative or trend description"),
  score: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score between 0 and 1"),
  price_change_24h: z.number().optional().describe("24h price change percentage"),
  market_cap_rank: z.number().optional().describe("Market cap ranking"),
});

export const moodboardOutputSchema = z.object({
  date: z.string().describe("Analysis date in ISO format"),
  coins: z
    .array(coinMoodSchema)
    .min(1)
    .describe("Array of analyzed coins with mood data"),
  market_sentiment: z
    .string()
    .optional()
    .describe("Overall market sentiment summary"),
  analyzed_at: z.string().describe("Timestamp of analysis in ISO format"),
});

export type CoinMood = z.infer<typeof coinMoodSchema>;
export type MoodboardOutput = z.infer<typeof moodboardOutputSchema>;
