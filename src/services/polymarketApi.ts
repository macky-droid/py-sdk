import { Market, OrderBook, LeaderboardEntry, Trade, Position } from '../types';
import { INITIAL_MARKETS, MOCK_LEADERBOARD, MOCK_TRADES, MOCK_POSITIONS, generateMockOrderBook } from '../mockData';

const BASE_URL = '/api';

export async function fetchMarkets(params?: { category?: string; query?: string; limit?: number }): Promise<Market[]> {
  try {
    const url = new URL(`${window.location.origin}${BASE_URL}/markets`);
    if (params?.category && params.category !== 'All') url.searchParams.set('tag', params.category);
    if (params?.query) url.searchParams.set('query', params.query);
    if (params?.limit) url.searchParams.set('limit', String(params.limit));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('Backend proxy fetch failed, using local high-fidelity state:', err);
  }

  // Filter local fallback
  let list = [...INITIAL_MARKETS];
  if (params?.category && params.category !== 'All') {
    list = list.filter(m => m.category.toLowerCase().includes(params.category!.toLowerCase()) || m.tags?.some(t => t.toLowerCase().includes(params.category!.toLowerCase())));
  }
  if (params?.query) {
    const q = params.query.toLowerCase();
    list = list.filter(m => m.question.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q));
  }
  return list;
}

export async function fetchOrderBook(tokenId?: string, defaultPrice: number = 0.5): Promise<OrderBook> {
  if (tokenId) {
    try {
      const res = await fetch(`${BASE_URL}/book?token_id=${encodeURIComponent(tokenId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.bids || data.asks)) {
          return {
            assetId: tokenId,
            timestamp: new Date().toISOString(),
            bids: (data.bids || []).map((b: any) => ({ price: parseFloat(b.price), size: parseFloat(b.size) })),
            asks: (data.asks || []).map((a: any) => ({ price: parseFloat(a.price), size: parseFloat(a.size) })),
            midpoint: data.midpoint ? parseFloat(data.midpoint) : undefined,
            spread: data.spread ? parseFloat(data.spread) : undefined
          };
        }
      }
    } catch {
      // fallback
    }
  }

  const generated = generateMockOrderBook(defaultPrice);
  return {
    assetId: tokenId || 'sample-token',
    timestamp: new Date().toISOString(),
    bids: generated.bids,
    asks: generated.asks,
    midpoint: generated.midpoint,
    spread: generated.spread
  };
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`${BASE_URL}/leaderboard`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // fallback
  }
  return MOCK_LEADERBOARD;
}

export async function fetchRecentTrades(marketId?: string): Promise<Trade[]> {
  try {
    const res = await fetch(`${BASE_URL}/trades${marketId ? `?market=${encodeURIComponent(marketId)}` : ''}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // fallback
  }
  return MOCK_TRADES;
}

export async function fetchUserPositions(address: string): Promise<Position[]> {
  try {
    const res = await fetch(`${BASE_URL}/positions?user=${encodeURIComponent(address)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // fallback
  }
  return MOCK_POSITIONS;
}
