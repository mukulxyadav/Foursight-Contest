const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://foursight-backend.harshiyer.workers.dev/api/v1";

export interface StockQuote {
  symbol: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  dayChange: number;
  dayChangePerc: number;
}

/**
 * Fetches the live price for a stock from the Foursight backend.
 * This is ALWAYS called server-side — the client can never inject a fake price.
 */
export async function getLivePrice(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/getStockQuote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: Buffer.from(symbol).toString("base64") }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.stockQuote?.ltp ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetches live prices for multiple symbols.
 * Returns a map of symbol → ltp.
 */
export async function getLivePrices(
  symbols: string[]
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  // Fetch in parallel (capped to avoid overwhelming the backend)
  const chunks = chunkArray(symbols, 5);
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (symbol) => {
        const price = await getLivePrice(symbol);
        if (price !== null) results[symbol] = price;
      })
    );
  }
  return results;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
