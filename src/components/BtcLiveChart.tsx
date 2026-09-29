import React, { useState, useRef, useMemo } from 'react';
import { PricePoint } from '../types';
import { TrendingUp, TrendingDown, Eye, Activity, Maximize2, RefreshCw, ExternalLink } from 'lucide-react';

interface BtcLiveChartProps {
  priceHistory: PricePoint[];
  currentPrice: number;
  strikePrice: number;
  roundStartTime: number;
  durationSeconds: number;
  isHoldPhase: boolean;
  winner?: 'UP' | 'DOWN' | 'DRAW';
  settlementPrice?: number;
  liveSnapTrigger?: number;
}

export const BtcLiveChart: React.FC<BtcLiveChartProps> = ({
  priceHistory,
  currentPrice,
  strikePrice,
  roundStartTime,
  durationSeconds,
  isHoldPhase,
  winner,
  settlementPrice,
  liveSnapTrigger,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<'line' | 'candles'>('line');
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (liveSnapTrigger) {
      setHoverIndex(null);
    }
  }, [liveSnapTrigger]);

  // Determine current trend relative to strike
  const effectivePrice = settlementPrice ?? currentPrice;
  const isUp = effectivePrice >= strikePrice;
  const priceDiff = effectivePrice - strikePrice;
  const percentDiff = strikePrice > 0 ? (priceDiff / strikePrice) * 100 : 0;

  // Chart dimensions & coordinates
  const width = 800;
  const height = 360;
  const padding = { top: 30, right: 85, bottom: 40, left: 20 };

  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;

  // Compute price bounds
  const { minPrice, maxPrice, prices } = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) {
      const base = currentPrice || 96000;
      return { minPrice: base * 0.999, maxPrice: base * 1.001, prices: [] };
    }

    const allPrices = priceHistory.map((p) => p.price);
    allPrices.push(strikePrice);
    if (settlementPrice) allPrices.push(settlementPrice);

    let min = Math.min(...allPrices);
    let max = Math.max(...allPrices);

    // Add 15% breathing room
    const spread = Math.max(max - min, strikePrice * 0.0006, 10);
    min = min - spread * 0.2;
    max = max + spread * 0.2;

    return { minPrice: min, maxPrice: max, prices: priceHistory };
  }, [priceHistory, strikePrice, currentPrice, settlementPrice]);

  // Scaling helpers
  const getX = (index: number, total: number) => {
    if (total <= 1) return padding.left;
    return padding.left + (index / (total - 1)) * usableWidth;
  };

  const getY = (val: number) => {
    if (maxPrice === minPrice) return height / 2;
    const norm = (val - minPrice) / (maxPrice - minPrice);
    return height - padding.bottom - norm * usableHeight;
  };

  // Build SVG path
  const pathD = useMemo(() => {
    if (prices.length === 0) return '';
    return prices.reduce((acc, pt, idx) => {
      const x = getX(idx, prices.length);
      const y = getY(pt.price);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [prices, minPrice, maxPrice, usableWidth, usableHeight]);

  const areaD = useMemo(() => {
    if (prices.length === 0) return '';
    const firstX = getX(0, prices.length);
    const lastX = getX(prices.length - 1, prices.length);
    const bottomY = height - padding.bottom;
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [pathD, prices.length, height, padding.bottom]);

  // Strike line Y coordinate
  const strikeY = getY(strikePrice);
  const currentY = getY(effectivePrice);
  const lastX = getX(prices.length - 1, prices.length);

  // Y-axis tick values (5 lines)
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 5;
    const step = (maxPrice - minPrice) / (count - 1);
    for (let i = 0; i < count; i++) {
      ticks.push(minPrice + i * step);
    }
    return ticks;
  }, [minPrice, maxPrice]);

  // Hover data
  const hoveredPoint = hoverIndex !== null && prices[hoverIndex] ? prices[hoverIndex] : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = (mouseX - padding.left) / usableWidth;
    const idx = Math.round(ratio * (prices.length - 1));
    if (idx >= 0 && idx < prices.length) {
      setHoverIndex(idx);
    } else {
      setHoverIndex(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Chart Top Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <span className="font-bold text-amber-400 text-sm">₿</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-base">BTC / USD</h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE 1s TICKS
              </span>
            </div>
            <p className="text-xs text-slate-400">Polymarket 3-Minute Beat Stream</p>
          </div>
        </div>

        {/* Current Price & Delta vs Strike */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-slate-400">Current Price</div>
            <div
              className={`text-xl sm:text-2xl font-mono font-extrabold transition-colors duration-200 ${
                isUp ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ${effectivePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="text-right pl-4 border-l border-slate-800">
            <div className="text-xs text-slate-400">Delta vs Strike</div>
            <div
              className={`text-sm font-mono font-bold flex items-center justify-end gap-1 ${
                isUp ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>
                {priceDiff >= 0 ? '+' : ''}${priceDiff.toFixed(2)} ({percentDiff >= 0 ? '+' : ''}
                {percentDiff.toFixed(3)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setChartMode('line')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                chartMode === 'line' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartMode('candles')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                chartMode === 'candles' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Candles
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div ref={containerRef} className="relative w-full h-[320px] sm:h-[380px] bg-slate-950/70 select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Bullish Gradient */}
            <linearGradient id="bullGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>

            {/* Bearish Gradient */}
            <linearGradient id="bearGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
            </linearGradient>

            {/* Filter glow */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {yTicks.map((val, i) => {
            const y = getY(val);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={width - padding.right + 8}
                  y={y + 3.5}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  ${val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* STRIKE PRICE REFERENCE LINE */}
          <g>
            <line
              x1={padding.left}
              y1={strikeY}
              x2={width - padding.right}
              y2={strikeY}
              stroke="#eab308"
              strokeDasharray="5 4"
              strokeWidth="1.5"
            />
            {/* Strike Price Pill Label on right */}
            <rect
              x={width - padding.right + 2}
              y={strikeY - 9}
              width="80"
              height="18"
              rx="4"
              fill="#854d0e"
              opacity="0.9"
            />
            <text
              x={width - padding.right + 6}
              y={strikeY + 3.5}
              fill="#fef08a"
              fontSize="9.5"
              fontFamily="monospace"
              fontWeight="bold"
            >
              🎯 ${strikePrice.toFixed(1)}
            </text>
          </g>

          {/* CANDLESTICKS VIEW */}
          {chartMode === 'candles' &&
            prices.map((pt, idx) => {
              const x = getX(idx, prices.length);
              const o = pt.open ?? pt.price * 0.9999;
              const c = pt.close ?? pt.price;
              const h = pt.high ?? Math.max(o, c) * 1.0002;
              const l = pt.low ?? Math.min(o, c) * 0.9998;
              const candleUp = c >= o;
              const color = candleUp ? '#10B981' : '#F43F5E';
              const yOpen = getY(o);
              const yClose = getY(c);
              const yHigh = getY(h);
              const yLow = getY(l);
              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
              const candleWidth = Math.max(2, Math.min(10, usableWidth / (prices.length * 1.4)));

              return (
                <g key={idx}>
                  {/* Wick */}
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" />
                  {/* Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })}

          {/* AREA & LINE VIEW */}
          {chartMode === 'line' && (
            <>
              {/* Fill Area under path */}
              <path
                d={areaD}
                fill={isUp ? 'url(#bullGradient)' : 'url(#bearGradient)'}
                className="transition-colors duration-500"
              />

              {/* Price Line */}
              <path
                d={pathD}
                fill="none"
                stroke={isUp ? '#10B981' : '#F43F5E'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />
            </>
          )}

          {/* Current Live Pulse Marker at latest point */}
          {prices.length > 0 && (
            <g>
              <circle
                cx={lastX}
                cy={currentY}
                r="7"
                fill={isUp ? '#10B981' : '#F43F5E'}
                opacity="0.3"
                className="animate-ping"
              />
              <circle
                cx={lastX}
                cy={currentY}
                r="4.5"
                fill={isUp ? '#34D399' : '#FB7185'}
                stroke="#0f172a"
                strokeWidth="2"
              />

              {/* Current Price Label on Right */}
              <rect
                x={width - padding.right + 2}
                y={currentY - 10}
                width="80"
                height="20"
                rx="4"
                fill={isUp ? '#065f46' : '#881337'}
              />
              <text
                x={width - padding.right + 6}
                y={currentY + 3.5}
                fill="#ffffff"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                ${effectivePrice.toFixed(1)}
              </text>
            </g>
          )}

          {/* Hover Crosshair & Tooltip */}
          {hoveredPoint && hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex, prices.length)}
                y1={padding.top}
                x2={getX(hoverIndex, prices.length)}
                y2={height - padding.bottom}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={getX(hoverIndex, prices.length)}
                cy={getY(hoveredPoint.price)}
                r="5"
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && hoverIndex !== null && (
          <div
            className="absolute top-3 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs font-mono pointer-events-none z-20 flex items-center gap-4"
          >
            <div>
              <span className="text-slate-400 block text-[10px]">TIME</span>
              <span className="text-slate-200">{new Date(hoveredPoint.time).toLocaleTimeString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">PRICE</span>
              <span className="text-sky-300 font-bold">${hoveredPoint.price.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">VS STRIKE</span>
              <span className={hoveredPoint.price >= strikePrice ? 'text-emerald-400' : 'text-rose-400'}>
                {hoveredPoint.price >= strikePrice ? '+' : ''}${(hoveredPoint.price - strikePrice).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Hold On State Overlay Banner */}
        {isHoldPhase && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[3px] flex items-center justify-center p-4 z-30 animate-fade-in">
            <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/40">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <h4 className="text-xl font-extrabold text-amber-300 tracking-tight">
                Hold on, determining winner...
              </h4>
              <div className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Bitcoin Up or Down
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                This market has ended. Final resolution will appear automatically as soon as it is available on-chain.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex flex-col items-center gap-1">
                <span>Resolution Source:</span>
                <a
                  href="https://data.chain.link/streams/btc-usd-twap-60s-streams"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 font-semibold break-all"
                >
                  https://data.chain.link/streams/btc-usd-twap-60s-streams
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-yellow-400 inline-block"></span>
            <span>Strike: <strong className="text-slate-200 font-mono">${strikePrice.toFixed(2)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
            <span>UP: Above Strike</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>
            <span>DOWN: Below Strike</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <span>Resolution Source:</span>
          <a
            href="https://data.chain.link/streams/btc-usd-twap-60s-streams"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
          >
            <span>Chainlink Data Streams</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};
