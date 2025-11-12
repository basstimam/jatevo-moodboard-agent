/**
 * Type definitions for Market Moodboard Agent
 */

export interface CoinMood {
  symbol: string;
  mood: string;
  narrative: string;
  score: number;
  price_change_24h?: number;
  market_cap_rank?: number;
}

export interface MoodboardOutput {
  date: string;
  coins: CoinMood[];
  market_sentiment?: string;
  analyzed_at: string;
}
