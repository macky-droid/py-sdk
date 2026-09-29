import React, { useState, useEffect } from 'react';
import { Market, OrderBook as OrderBookType } from '../types';
import { fetchOrderBook } from '../services/polymarketApi';
import { OrderBookView } from './OrderBook';
import { useWallet } from '../context/WalletContext';
import { X, ExternalLink, Code2, Check, Copy, ArrowRight, ShieldCheck, HelpCircle, Wallet } from 'lucide-react';

interface MarketModalProps {
  market: Market;
  onClose: () => void;
}

export const MarketModal: React.FC<MarketModalProps> = ({ market, onClose }) => {
  const { balance, deductFunds } = useWallet();
  const [selectedOutcome, setSelectedOutcome] = useState<'Yes' | 'No'>('Yes');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [amountUsd, setAmountUsd] = useState<number>(100);
  const [orderBook, setOrderBook] = useState<OrderBookType | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [orderPlacedAlert, setOrderPlacedAlert] = useState<string | null>(null);

  const outcomeIndex = selectedOutcome === 'Yes' ? 0 : 1;
  const currentPrice = market.outcomePrices[outcomeIndex] ?? 0.5;
  const tokenId = market.clobTokenIds?.[0] || 'token_sample_id';

  useEffect(() => {
    fetchOrderBook(tokenId, currentPrice).then(setOrderBook);
  }, [tokenId, currentPrice]);

  const estimatedShares = +(amountUsd / Math.max(0.01, currentPrice)).toFixed(1);
  const potentialPayout = +estimatedShares.toFixed(2);
  const potentialProfit = +(potentialPayout - amountUsd).toFixed(2);
  const roiPercent = +((potentialProfit / amountUsd) * 100).toFixed(1);

  const pythonSnippet = `# Fetch and trade this market using polymarket-client Python SDK
from polymarket import PublicClient, SecureClient

with PublicClient() as client:
    market = client.get_market(id="${market.id}")
    print(f"Question: {market.question}")
    
    # Check CLOB order book
    order_book = client.get_order_book(token_id="${tokenId}")
    print(f"Best Bid: {order_book.bids[0].price if order_book.bids else 'N/A'}")

# Example Order Placement with SecureClient:
# with SecureClient(private_key="0x...") as trader:
#     order = trader.create_limit_order(
#         token_id="${tokenId}",
#         side="BUY",
#         price=${currentPrice},
#         size=${estimatedShares}
#     )
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSimulateTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deductFunds(amountUsd)) {
      alert(`Insufficient funds in Live Wallet ($${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}). Deposit or reset balance!`);
      return;
    }
    setOrderPlacedAlert(`Simulated ${orderType} order for $${amountUsd} on "${selectedOutcome}" placed! Potential payout: $${potentialPayout} (${roiPercent}% ROI)`);
    setTimeout(() => setOrderPlacedAlert(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                {market.category}
              </span>
              {market.active && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Trading
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-100">{market.question}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Left Column: Details & Order Book */}
          <div className="lg:col-span-7 space-y-6">
            {/* Description */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                Resolution Criteria
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">{market.description}</p>
              {market.resolutionSource && (
                <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-1.5">
                  <strong className="text-slate-300">Resolution Source:</strong>{' '}
                  {market.resolutionSource.startsWith('http') ? (
                    <a
                      href={market.resolutionSource}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 font-mono break-all"
                    >
                      {market.resolutionSource}
                      <ExternalLink className="w-3 h-3 inline shrink-0" />
                    </a>
                  ) : (
                    <span>{market.resolutionSource}</span>
                  )}
                </div>
              )}
            </div>

            {/* Live Order Book */}
            {orderBook && <OrderBookView orderBook={orderBook} />}

            {/* Python SDK snippet */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span>Python SDK Code Snippet (polymarket-client)</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-xs font-mono bg-slate-900/90 text-indigo-200 p-3 rounded-lg overflow-x-auto leading-relaxed border border-slate-800">
                {pythonSnippet}
              </pre>
            </div>
          </div>

          {/* Right Column: Trade Execution & Stats */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Total Volume</span>
                <p className="text-sm font-semibold text-slate-100">${market.volume.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-400">Liquidity</span>
                <p className="text-sm font-semibold text-slate-100">${(market.liquidity ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-400">End Date</span>
                <p className="text-sm font-semibold text-slate-100">
                  {market.endDate ? new Date(market.endDate).toLocaleDateString() : 'Active'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Condition ID</span>
                <p className="text-xs font-mono text-slate-400 truncate" title={market.conditionId}>
                  {market.conditionId ? `${market.conditionId.slice(0, 10)}...` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Trading Box Simulator */}
            <form onSubmit={handleSimulateTrade} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-semibold text-slate-200 text-sm">Trade Simulator</h4>
                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setOrderType('LIMIT')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      orderType === 'LIMIT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Limit
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('MARKET')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      orderType === 'MARKET' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Market
                  </button>
                </div>
              </div>

              {/* Outcome Picker (Yes vs No) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOutcome('Yes')}
                  className={`p-3 rounded-xl border text-center transition ${
                    selectedOutcome === 'Yes'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">BUY YES</div>
                  <div className="text-lg font-bold">${market.outcomePrices[0]?.toFixed(2) ?? '0.50'}</div>
                  <div className="text-[11px] text-emerald-500">
                    {Math.round((market.outcomePrices[0] ?? 0.5) * 100)}% chance
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOutcome('No')}
                  className={`p-3 rounded-xl border text-center transition ${
                    selectedOutcome === 'No'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-400 shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">BUY NO</div>
                  <div className="text-lg font-bold">${market.outcomePrices[1]?.toFixed(2) ?? '0.50'}</div>
                  <div className="text-[11px] text-rose-500">
                    {Math.round((market.outcomePrices[1] ?? 0.5) * 100)}% chance
                  </div>
                </button>
              </div>

              {/* Amount input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-400">Investment Amount (USD)</label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Live Balance: <strong className="text-emerald-400">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                  <input
                    type="number"
                    min="1"
                    max={balance}
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {/* Preset chips */}
                <div className="flex gap-2 mt-2">
                  {[50, 100, 250, 500, 1000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmountUsd(val)}
                      className="px-2 py-0.5 text-xs rounded bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payout Calculation Card */}
              <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Shares:</span>
                  <span className="font-mono text-slate-200">{estimatedShares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Avg Price:</span>
                  <span className="font-mono text-slate-200">${currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Max Payout:</span>
                  <span className="font-mono font-semibold text-emerald-400">${potentialPayout.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1.5 font-medium">
                  <span className="text-slate-300">Potential Return:</span>
                  <span className="text-emerald-400">
                    +${potentialProfit.toLocaleString()} ({roiPercent}%)
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2 ${
                  selectedOutcome === 'Yes'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                }`}
              >
                <span>Simulate Order ({selectedOutcome})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {orderPlacedAlert && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center animate-fade-in">
                  {orderPlacedAlert}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
