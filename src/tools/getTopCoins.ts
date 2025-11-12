/**
 * CoinGecko API tool for fetching top coins by market cap
 */

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

export interface GetTopCoinsParams {
  limit?: number;
  vs_currency?: string;
}

/**
 * Fetches top coins from CoinGecko API sorted by market cap
 * @param limit - Number of coins to fetch (default: 10)
 * @param vs_currency - Currency for price data (default: "usd")
 * @returns Array of coin data
 */
export async function getTopCoins({
  limit = 10,
  vs_currency = "usd",
}: GetTopCoinsParams = {}): Promise<CoinData[]> {
  const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=${vs_currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `CoinGecko API error: ${response.statusText} (Status: ${response.status})`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid response format from CoinGecko API");
    }

    return data as CoinData[];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch top coins: ${error.message}`);
    }
    throw new Error("Failed to fetch top coins: Unknown error");
  }
}
