import React, { useState, useEffect } from 'react';
import { Position } from '../types';
import { fetchUserPositions } from '../services/polymarketApi';
import { Wallet, Search, TrendingUp, TrendingDown, ArrowUpRight, CheckCircle2 } from 'lucide-react';

const SAMPLE_WALLETS = [
  { label: 'Theo4 (Whale #1)', address: '0x9d4b68e920d1e57c6b48201d4a86b1f48c082736' },
  { label: 'Domer (Whale #2)', address: '0x2b8109d73c52a06148301f4820d9a6c7104b9281' },
  { label: 'Vitalik.eth', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
];

export const PortfolioTracker: React.FC = () => {
  const [address, setAddress] = useState(SAMPLE_WALLETS[0].address);
  const [inputAddress, setInputAddress] = useState(SAMPLE_WALLETS[0].address);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchUserPositions(address)
      .then(setPositions)
      .finally(() => setLoading(false));
  }, [address]);

  const totalInvested = positions.reduce((acc, p) => acc + p.investedUsd, 0);
  const totalCurrentValue = positions.reduce((acc, p) => acc + p.currentUsd, 0);
  const totalPnl = +(totalCurrentValue - totalInvested).toFixed(2);
  const totalPnlPercent = totalInvested > 0 ? +((totalPnl / totalInvested) * 100).toFixed(2) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputAddress.trim()) {
      setAddress(inputAddress.trim());
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-slate-100">Polymarket Portfolio & Position Tracker</h1>
        </div>
        <p className="text-sm text-slate-400">
          Query open positions, portfolio value, and historical performance for any Polygon or Polymarket proxy address.
        </p>
      </div>

      {/* Address Bar & Quick Select */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="Enter Polygon Wallet / Proxy Address (0x...)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition"
          >
            Track
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
          <span>Sample Accounts:</span>
          {SAMPLE_WALLETS.map((w) => (
            <button
              key={w.address}
              onClick={() => {
                setInputAddress(w.address);
                setAddress(w.address);
              }}
              className={`px-3 py-1 rounded-lg border transition ${
                address === w.address
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium">Total Portfolio Value</span>
          <p className="text-2xl font-bold text-slate-100 font-mono mt-1">
            ${totalCurrentValue.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium">Total Cost Basis</span>
          <p className="text-2xl font-bold text-slate-300 font-mono mt-1">
            ${totalInvested.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium">Unrealized PnL</span>
          <div className="flex items-baseline gap-2 mt-1">
            <p className={`text-2xl font-bold font-mono ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalPnl >= 0 ? `+$${totalPnl.toLocaleString()}` : `-$${Math.abs(totalPnl).toLocaleString()}`}
            </p>
            <span className={`text-xs font-semibold ${totalPnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ({totalPnlPercent >= 0 ? `+${totalPnlPercent}%` : `${totalPnlPercent}%`})
            </span>
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Active Positions ({positions.length})</h3>
          <span className="text-xs text-slate-500 font-mono">{address.slice(0, 10)}...</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950/40">
                <th className="py-3 px-4">Market</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4 text-right">Shares</th>
                <th className="py-3 px-4 text-right">Avg / Current</th>
                <th className="py-3 px-4 text-right">Value</th>
                <th className="py-3 px-4 text-right">PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {positions.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 max-w-sm">
                    <p className="font-semibold text-slate-200 truncate">{p.marketTitle}</p>
                    <p className="text-[10px] font-mono text-slate-500">Asset: {p.assetId.slice(0, 16)}...</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                        p.outcome === 'Yes'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {p.outcome}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                    {p.shares.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                    ${p.avgPrice.toFixed(2)} → <strong className="text-slate-200">${p.curPrice.toFixed(2)}</strong>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-100">
                    ${p.currentUsd.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className={`font-bold ${p.pnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.pnlUsd >= 0 ? `+$${p.pnlUsd}` : `-$${Math.abs(p.pnlUsd)}`}
                    </div>
                    <div className={`text-[10px] ${p.pnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {p.pnlPercent >= 0 ? `+${p.pnlPercent}%` : `${p.pnlPercent}%`}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
