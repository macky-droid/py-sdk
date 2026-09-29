import { Market, LeaderboardEntry, Trade, Position } from './types';

export const INITIAL_MARKETS: Market[] = [
  {
    id: '0x101a9b42e7c4f83',
    conditionId: '0x6b8f36a87c126d40026e680a6c6c59b2d287bc126dae0ea341398bb1e247475d',
    slug: 'fed-interest-rates-cut-november-2024',
    question: 'Fed cuts interest rates by 25+ bps in upcoming FOMC meeting?',
    description: 'This market resolves to Yes if the Federal Open Market Committee (FOMC) announces a federal funds target rate reduction of at least 25 basis points at the scheduled meeting.',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
    category: 'Economics',
    volume: 18450200,
    volume24hr: 1245000,
    liquidity: 4230000,
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.86, 0.14],
    clobTokenIds: [
      '2174263314346390629056905015582624153306727273685674'
    ],
    active: true,
    closed: false,
    endDate: '2025-11-06T18:00:00Z',
    resolutionSource: 'Federal Reserve Board FOMC statement',
    spread: 0.01,
    tags: ['Economy', 'Fed', 'Rates', 'Macro']
  },
  {
    id: '0x202b8c91d4e5f72',
    conditionId: '0x7e29a30b42f63819280cd692bc1381273940173820194829375019283740291a',
    slug: 'bitcoin-reaches-100k-in-2025',
    question: 'Will Bitcoin reach $100,000 before end of Q2 2025?',
    description: 'Resolves to Yes if Binance, Coinbase, or Kraken BTC/USD spot trade price reaches or exceeds $100,000.00 at any point prior to the resolution date.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    category: 'Crypto',
    volume: 34120900,
    volume24hr: 3120500,
    liquidity: 8900400,
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.68, 0.32],
    clobTokenIds: [
      '9982319482019283019283019283019283019283019283019283'
    ],
    active: true,
    closed: false,
    endDate: '2025-06-30T23:59:59Z',
    resolutionSource: 'https://data.chain.link/streams/btc-usd-twap-60s-streams',
    spread: 0.01,
    tags: ['Crypto', 'Bitcoin', 'BTC', 'Finance']
  },
  {
    id: '0x303c7d18e2a6b54',
    conditionId: '0x991a82b405e6c7d819283019284719283019283019283918239019283019283a',
    slug: 'us-presidential-election-popular-vote-margin',
    question: 'US Presidential Election: Popular Vote Margin > 3.5%?',
    description: 'Resolves to Yes if the certified winning presidential ticket wins the national popular vote by a margin strictly greater than 3.50 percentage points.',
    image: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&auto=format&fit=crop&q=80',
    category: 'Politics',
    volume: 68420100,
    volume24hr: 5410000,
    liquidity: 14200500,
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.42, 0.58],
    clobTokenIds: [
      '4419283019283019283019283019283019283019283019283019'
    ],
    active: true,
    closed: false,
    endDate: '2025-01-20T17:00:00Z',
    resolutionSource: 'Official Federal Election Commission Certification',
    spread: 0.02,
    tags: ['Politics', 'US Elections', 'Government']
  },
  {
    id: '0x404d6e29f3c7a81',
    conditionId: '0x882a17b5029e817263019283019283019283019283019283019283019283019b',
    slug: 'spacex-starship-orbital-catch-success',
    question: 'Will SpaceX successfully catch Super Heavy booster with Mechazilla on next test?',
    description: 'This market resolves to Yes if SpaceX achieves a controlled tower catch of the Super Heavy booster during the designated flight test.',
    image: 'https://images.unsplash.com/photo-1517976487502-540c7e2c9066?w=600&auto=format&fit=crop&q=80',
    category: 'Science & Tech',
    volume: 9840200,
    volume24hr: 890000,
    liquidity: 2450000,
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.74, 0.26],
    clobTokenIds: [
      '7729102938475610293847561029384756102938475610293847'
    ],
    active: true,
    closed: false,
    endDate: '2025-05-15T23:59:59Z',
    resolutionSource: 'SpaceX Official Broadcast & Mission Statement',
    spread: 0.01,
    tags: ['Science', 'SpaceX', 'Starship', 'Tech']
  },
  {
    id: '0x505e5f30a4d8b92',
    conditionId: '0x551a92b38102938471928301928301928301928301928301928301928301928c',
    slug: 'openai-gpt-5-announcement-q2-2025',
    question: 'OpenAI releases or announces GPT-5 / next-gen frontier model by June 2025?',
    description: 'Resolves to Yes if OpenAI publicly releases or announces the availability of GPT-5 or a succeeding flagship model before June 30, 2025.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=80',
    category: 'AI & Tech',
    volume: 12430000,
    volume24hr: 1100200,
    liquidity: 3600000,
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.81, 0.19],
    clobTokenIds: [
      '6619283019283019283019283019283019283019283019283019'
    ],
    active: true,
    closed: false,
    endDate: '2025-06-30T23:59:59Z',
    resolutionSource: 'Official OpenAI blog post or keynote',
    spread: 0.01,
    tags: ['AI', 'OpenAI', 'Technology', 'LLM']
  },
  {
    id: '0x606f4a41b5e9c03',
    conditionId: '0x334b82910293847561029384756102938475610293847561029384756102938d',
    slug: 'ethereum-spot-etf-net-inflows-5b',
    question: 'Ethereum Spot ETFs surpass $5 Billion net cumulative inflows?',
    description: 'Resolves to Yes if cumulative net flows across all US-approved Spot Ethereum ETFs reach or exceed $5,000,000,000 according to Farside Investors / Bloomberg data.',
    image: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=600&auto=format&fit=crop&q=80',
    category: 'Crypto',
    volume: 15300400,
    volume24hr: 940000,
    liquidity: 3100000,
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.55, 0.45],
    clobTokenIds: [
      '3319283019283019283019283019283019283019283019283019'
    ],
    active: true,
    closed: false,
    endDate: '2025-08-31T23:59:59Z',
    resolutionSource: 'Farside ETF Tracker / Bloomberg terminal',
    spread: 0.02,
    tags: ['Crypto', 'Ethereum', 'ETF', 'Finance']
  }
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    address: '0x9d4b68e920d1e57c6b48201d4a86b1f48c082736',
    name: 'Theo4',
    verified: true,
    volume: 84200000,
    pnl: 48900000,
    pnlPercent: 138.4,
    winRate: 84.2,
    tradesCount: 2314
  },
  {
    rank: 2,
    address: '0x2b8109d73c52a06148301f4820d9a6c7104b9281',
    name: 'Domer',
    verified: true,
    volume: 62450000,
    pnl: 29840000,
    pnlPercent: 94.6,
    winRate: 78.5,
    tradesCount: 4891
  },
  {
    rank: 3,
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    name: 'WhaleAlpha',
    verified: false,
    volume: 49100000,
    pnl: 18450000,
    pnlPercent: 67.2,
    winRate: 72.1,
    tradesCount: 1640
  },
  {
    rank: 4,
    address: '0x53d284357ec70ce289d6d64134dfac8e511c8a3d',
    name: 'PoliPredictor',
    verified: true,
    volume: 38900000,
    pnl: 14200000,
    pnlPercent: 58.9,
    winRate: 69.4,
    tradesCount: 3120
  },
  {
    rank: 5,
    address: '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
    name: 'vitalik.eth (watcher)',
    verified: true,
    volume: 24100000,
    pnl: 9640000,
    pnlPercent: 44.1,
    winRate: 76.0,
    tradesCount: 890
  }
];

export const MOCK_TRADES: Trade[] = [
  {
    id: 'tr_984210',
    marketTitle: 'Fed cuts interest rates by 25+ bps in upcoming FOMC meeting?',
    outcome: 'Yes',
    side: 'BUY',
    size: 50000,
    price: 0.86,
    usdValue: 43000,
    timestamp: '2 mins ago',
    txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b'
  },
  {
    id: 'tr_984209',
    marketTitle: 'Will Bitcoin reach $100,000 before end of Q2 2025?',
    outcome: 'Yes',
    side: 'BUY',
    size: 25000,
    price: 0.68,
    usdValue: 17000,
    timestamp: '5 mins ago',
    txHash: '0x8f7e6d5c4b3a2918273645102938475610293847561029384756102938475610'
  },
  {
    id: 'tr_984208',
    marketTitle: 'OpenAI releases or announces GPT-5 / next-gen frontier model by June 2025?',
    outcome: 'Yes',
    side: 'BUY',
    size: 12000,
    price: 0.81,
    usdValue: 9720,
    timestamp: '11 mins ago',
    txHash: '0x7182930495867182930495867182930495867182930495867182930495867182'
  },
  {
    id: 'tr_984207',
    marketTitle: 'US Presidential Election: Popular Vote Margin > 3.5%?',
    outcome: 'No',
    side: 'SELL',
    size: 30000,
    price: 0.58,
    usdValue: 17400,
    timestamp: '18 mins ago',
    txHash: '0x6574839201928374650192837465019283746501928374650192837465019283'
  }
];

export const MOCK_POSITIONS: Position[] = [
  {
    assetId: '2174263314346390629056905015582624153306727273685674',
    marketId: '0x101a9b42e7c4f83',
    marketTitle: 'Fed cuts interest rates by 25+ bps in upcoming FOMC meeting?',
    outcome: 'Yes',
    shares: 15000,
    avgPrice: 0.72,
    curPrice: 0.86,
    investedUsd: 10800,
    currentUsd: 12900,
    pnlUsd: 2100,
    pnlPercent: 19.44
  },
  {
    assetId: '9982319482019283019283019283019283019283019283019283',
    marketId: '0x202b8c91d4e5f72',
    marketTitle: 'Will Bitcoin reach $100,000 before end of Q2 2025?',
    outcome: 'Yes',
    shares: 20000,
    avgPrice: 0.54,
    curPrice: 0.68,
    investedUsd: 10800,
    currentUsd: 13600,
    pnlUsd: 2800,
    pnlPercent: 25.93
  },
  {
    assetId: '6619283019283019283019283019283019283019283019283019',
    marketId: '0x505e5f30a4d8b92',
    marketTitle: 'OpenAI releases or announces GPT-5 / next-gen frontier model by June 2025?',
    outcome: 'Yes',
    shares: 10000,
    avgPrice: 0.65,
    curPrice: 0.81,
    investedUsd: 6500,
    currentUsd: 8100,
    pnlUsd: 1600,
    pnlPercent: 24.62
  }
];

export function generateMockOrderBook(basePrice: number = 0.50): {
  bids: { price: number; size: number; total: number }[];
  asks: { price: number; size: number; total: number }[];
  midpoint: number;
  spread: number;
} {
  const p = Math.max(0.05, Math.min(0.95, basePrice));
  const bids = [];
  const asks = [];
  
  let bidTotal = 0;
  for (let i = 1; i <= 6; i++) {
    const price = Math.max(0.01, +(p - i * 0.01).toFixed(2));
    const size = Math.round((Math.sin(i) * 5000 + 12000) * (7 - i));
    bidTotal += size;
    bids.push({ price, size, total: bidTotal });
  }

  let askTotal = 0;
  for (let i = 0; i <= 5; i++) {
    const price = Math.min(0.99, +(p + (i + 1) * 0.01).toFixed(2));
    const size = Math.round((Math.cos(i) * 4500 + 11000) * (6 - i));
    askTotal += size;
    asks.push({ price, size, total: askTotal });
  }

  const bestBid = bids[0]?.price || p - 0.01;
  const bestAsk = asks[0]?.price || p + 0.01;
  const spread = +(bestAsk - bestBid).toFixed(3);
  const midpoint = +((bestBid + bestAsk) / 2).toFixed(3);

  return {
    bids,
    asks,
    midpoint,
    spread
  };
}
