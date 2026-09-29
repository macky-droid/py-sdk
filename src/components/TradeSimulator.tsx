import React, { useState } from 'react';
import { Calculator, ArrowRight, Percent, DollarSign, TrendingUp, Info } from 'lucide-react';

export const TradeSimulator: React.FC = () => {
  const [marketPrice, setMarketPrice] = useState<number>(0.65);
  const [fairValue, setFairValue] = useState<number>(0.75);
  const [stake, setStake] = useState<number>(500);
  const [side, setSide] = useState<'YES' | 'NO'>('YES');

  // Calculations
  const effectivePrice = side === 'YES' ? marketPrice : +(1 - marketPrice).toFixed(2);
  const effectiveFair = side === 'YES' ? fairValue : +(1 - fairValue).toFixed(2);

  const numShares = Math.max(0, +(stake / Math.max(0.01, effectivePrice)).toFixed(1));
  const maxPayout = numShares; // $1 per share if resolved correct
  const potentialProfit = +(maxPayout - stake).toFixed(2);
  const roi = stake > 0 ? +((potentialProfit / stake) * 100).toFixed(1) : 0;

  // Expected Value: (p_win * payout) - stake
  const expectedPayout = +(effectiveFair * maxPayout).toFixed(2);
  const expectedValue = +(expectedPayout - stake).toFixed(2);
  const edge = +(((effectiveFair - effectivePrice) / effectivePrice) * 100).toFixed(1);

  // Kelly Criterion fraction = (b*p - q) / b, where b = (1/effectivePrice) - 1
  const b = (1 / effectivePrice) - 1;
  const p = effectiveFair;
  const q = 1 - p;
  const kellyFraction = b > 0 ? Math.max(0, Math.min(1, +((b * p - q) / b).toFixed(3))) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-slate-100">Polymarket Odds & Expected Value Calculator</h1>
        </div>
        <p className="text-sm text-slate-400">
          Compute position sizing, expected value (EV), implied odds, and Kelly criterion allocation for prediction contracts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="font-semibold text-slate-200 text-sm border-b border-slate-800 pb-2">
            Contract & Edge Parameters
          </h3>

          {/* Outcome Side */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Selected Position</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('YES')}
                className={`py-2 px-3 rounded-lg font-semibold text-xs transition border ${
                  side === 'YES'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                BUY YES
              </button>
              <button
                type="button"
                onClick={() => setSide('NO')}
                className={`py-2 px-3 rounded-lg font-semibold text-xs transition border ${
                  side === 'NO'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                BUY NO
              </button>
            </div>
          </div>

          {/* Market Price */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium mb-1.5">
              <span className="text-slate-400">Market Price (Implied Probability)</span>
              <span className="text-blue-400 font-mono font-bold">${marketPrice.toFixed(2)} ({Math.round(marketPrice * 100)}%)</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.99"
              step="0.01"
              value={marketPrice}
              onChange={(e) => setMarketPrice(parseFloat(e.target.value))}
              className="w-full accent-blue-500 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Your Fair Value Assessment */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium mb-1.5">
              <span className="text-slate-400">Your Estimated Fair Probability</span>
              <span className="text-indigo-400 font-mono font-bold">{Math.round(fairValue * 100)}% (${fairValue.toFixed(2)})</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.99"
              step="0.01"
              value={fairValue}
              onChange={(e) => setFairValue(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Capital Stake */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Capital Stake ($USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
              <input
                type="number"
                min="10"
                max="100000"
                value={stake}
                onChange={(e) => setStake(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Results Analysis */}
        <div className="md:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-slate-200 text-sm border-b border-slate-800 pb-2">
              Expected Outcome & Payoff
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Contracts (Shares)</span>
                <p className="text-lg font-mono font-bold text-slate-100">{numShares.toLocaleString()}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Total Max Payout</span>
                <p className="text-lg font-mono font-bold text-emerald-400">${maxPayout.toLocaleString()}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Max Profit If Won</span>
                <p className="text-lg font-mono font-bold text-emerald-400">+${potentialProfit.toLocaleString()}</p>
                <span className="text-[10px] text-emerald-500">+{roi}% ROI</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Expected Value (EV)</span>
                <p className={`text-lg font-mono font-bold ${expectedValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {expectedValue >= 0 ? `+$${expectedValue}` : `-$${Math.abs(expectedValue)}`}
                </p>
                <span className="text-[10px] text-slate-500">Edge: {edge}%</span>
              </div>
            </div>

            {/* Kelly Criterion */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-indigo-300 font-semibold">
                <span>Kelly Criterion Optimal Stake:</span>
                <span className="font-mono text-sm">{(kellyFraction * 100).toFixed(1)}% of bankroll</span>
              </div>
              <p className="text-slate-400 leading-normal">
                {edge > 0
                  ? `You have a positive theoretical edge of ${edge}%. Kelly recommends deploying up to ${(kellyFraction * 100).toFixed(1)}% of trading bankroll.`
                  : 'Negative theoretical edge. Taking this position has a negative expected value based on your estimates.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
