import React from 'react';
import { Market } from '../types';
import { DollarSign, Clock, ArrowUpRight, BarChart2 } from 'lucide-react';

interface MarketCardProps {
  market: Market;
  onSelect: (market: Market) => void;
}

export const MarketCard: React.FC<MarketCardProps> = ({ market, onSelect }) => {
  const yesPrice = market.outcomePrices[0] ?? 0.5;
  const noPrice = market.outcomePrices[1] ?? (1 - yesPrice);
  const yesPercent = Math.round(yesPrice * 100);
  const noPercent = Math.round(noPrice * 100);

  const formattedVolume = (market.volume >= 1_000_000)
    ? `$${(market.volume / 1_000_000).toFixed(1)}M`
    : `$${(market.volume / 1_000).toFixed(0)}k`;

  return (
    <div
      onClick={() => onSelect(market)}
      className="group bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {market.category}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Vol: {formattedVolume}</span>
          </div>
        </div>

        {/* Question */}
        <h3 className="font-semibold text-slate-100 text-base leading-snug group-hover:text-blue-400 transition mb-4">
          {market.question}
        </h3>
      </div>

      <div>
        {/* Probability Bars */}
        <div className="space-y-2 mb-4">
          {/* YES Outcome */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Yes: ${(yesPrice).toFixed(2)}
              </span>
              <span className="font-bold text-emerald-400 text-sm">{yesPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${yesPercent}%` }}
              ></div>
            </div>
          </div>

          {/* NO Outcome */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-rose-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                No: ${(noPrice).toFixed(2)}
              </span>
              <span className="font-bold text-rose-400 text-sm">{noPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-500 to-pink-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${noPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Resolves {market.endDate ? new Date(market.endDate).toLocaleDateString() : 'Active'}</span>
          </div>

          <div className="flex items-center gap-1 text-blue-400 font-medium group-hover:translate-x-0.5 transition">
            <span>Trade & Order Book</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
