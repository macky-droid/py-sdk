import React from 'react';
import { OrderBook } from '../types';
import { Layers } from 'lucide-react';

interface OrderBookProps {
  orderBook: OrderBook;
}

export const OrderBookView: React.FC<OrderBookProps> = ({ orderBook }) => {
  const maxBidSize = Math.max(...orderBook.bids.map(b => b.size), 1);
  const maxAskSize = Math.max(...orderBook.asks.map(a => a.size), 1);
  const maxSize = Math.max(maxBidSize, maxAskSize);

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-semibold text-slate-200">CLOB Live Order Book</h4>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {orderBook.spread !== undefined && (
            <span className="text-slate-400">
              Spread: <span className="font-mono text-slate-200">${orderBook.spread.toFixed(3)}</span>
            </span>
          )}
          {orderBook.midpoint !== undefined && (
            <span className="text-slate-400">
              Mid: <span className="font-mono text-blue-400">${orderBook.midpoint.toFixed(3)}</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        {/* BIDS (Buy orders - Green) */}
        <div>
          <div className="flex justify-between text-slate-400 border-b border-slate-800/80 pb-1 mb-1 font-sans text-[11px] uppercase tracking-wider">
            <span>Size (Shares)</span>
            <span className="text-emerald-400">Bid Price</span>
          </div>
          <div className="space-y-1">
            {orderBook.bids.map((b, i) => {
              const depthPct = Math.min(100, Math.round((b.size / maxSize) * 100));
              return (
                <div key={i} className="relative flex justify-between items-center py-0.5 px-1 rounded hover:bg-slate-900 overflow-hidden">
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="text-slate-300 relative z-10">{b.size.toLocaleString()}</span>
                  <span className="text-emerald-400 font-bold relative z-10">${b.price.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ASKS (Sell orders - Red) */}
        <div>
          <div className="flex justify-between text-slate-400 border-b border-slate-800/80 pb-1 mb-1 font-sans text-[11px] uppercase tracking-wider">
            <span className="text-rose-400">Ask Price</span>
            <span>Size (Shares)</span>
          </div>
          <div className="space-y-1">
            {orderBook.asks.map((a, i) => {
              const depthPct = Math.min(100, Math.round((a.size / maxSize) * 100));
              return (
                <div key={i} className="relative flex justify-between items-center py-0.5 px-1 rounded hover:bg-slate-900 overflow-hidden">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="text-rose-400 font-bold relative z-10">${a.price.toFixed(2)}</span>
                  <span className="text-slate-300 relative z-10">{a.size.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
