export interface MarketOutcome {
  name: string;
  price: number;
  probability: number;
  change24h?: number;
  tokenId?: string;
}

export interface Market {
  id: string;
  conditionId?: string;
  slug: string;
  question: string;
  description?: string;
  image?: string;
  icon?: string;
  category: string;
  volume: number;
  volume24hr?: number;
  liquidity?: number;
  outcomes: string[];
  outcomePrices: number[];
  clobTokenIds?: string[];
  active: boolean;
  closed: boolean;
  endDate?: string;
  resolutionSource?: string;
  spread?: number;
  tags?: string[];
}

export interface Event {
  id: string;
  ticker?: string;
  slug: string;
  title: string;
  description?: string;
  image?: string;
  icon?: string;
  volume: number;
  liquidity?: number;
  active: boolean;
  closed: boolean;
  startDate?: string;
  endDate?: string;
  markets: Market[];
  tags?: { id: string; label: string; slug: string }[];
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total?: number;
}

export interface OrderBook {
  marketId?: string;
  assetId?: string;
  timestamp: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  midpoint?: number;
  spread?: number;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  name?: string;
  verified?: boolean;
  volume: number;
  pnl: number;
  pnlPercent: number;
  winRate: number;
  tradesCount: number;
}

export interface Trade {
  id: string;
  marketTitle: string;
  outcome: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
  usdValue: number;
  timestamp: string;
  makerAddress?: string;
  takerAddress?: string;
  txHash?: string;
}

export interface Position {
  assetId: string;
  marketId: string;
  marketTitle: string;
  outcome: string;
  shares: number;
  avgPrice: number;
  curPrice: number;
  investedUsd: number;
  currentUsd: number;
  pnlUsd: number;
  pnlPercent: number;
}

export interface PricePoint {
  time: number; // timestamp in ms
  price: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
}

export type BeatPrediction = 'UP' | 'DOWN';

export type BeatRoundStatus = 'ACTIVE' | 'HOLD_DETERMINING_WINNER' | 'RESOLVED';

export interface UserBeat {
  id: string;
  prediction: BeatPrediction;
  amount: number;
  multiplier: number;
  potentialPayout: number;
  placedAt: number;
  resolvedOutcome?: 'WIN' | 'LOSS' | 'PUSH';
  payoutAwarded?: number;
}

export interface BeatRound {
  roundNumber: number;
  status: BeatRoundStatus;
  strikePrice: number;
  settlementPrice?: number;
  winner?: BeatPrediction | 'DRAW';
  startTime: number;
  durationSeconds: number; // default 180 (3 minutes)
  secondsRemaining: number;
  upPool: number;
  downPool: number;
  totalVolume: number;
  userBeat?: UserBeat;
}

export interface BeatHistoryItem {
  roundNumber: number;
  timestamp: string;
  strikePrice: number;
  settlementPrice: number;
  diff: number;
  winner: BeatPrediction | 'DRAW';
  userPrediction?: BeatPrediction;
  userPnl?: number;
  userResult?: 'WIN' | 'LOSS';
}

export interface BtcPriceAlert {
  id: string;
  type: 'STRIKE_CROSS' | 'SURGE' | 'POLYMARKET_ORACLE' | 'TARGET_REACHED';
  title: string;
  message: string;
  price: number;
  timeStr: string; // e.g. "16:19:42"
  minutesSeconds: string; // e.g. "01:42 remaining"
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  timestamp: number;
}
