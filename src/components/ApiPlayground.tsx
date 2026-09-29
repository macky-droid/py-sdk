import React, { useState } from 'react';
import { Code2, Play, Copy, Check, Terminal, ExternalLink, BookOpen } from 'lucide-react';

interface CodeSnippet {
  title: string;
  category: string;
  description: string;
  code: string;
  mockOutput: any;
}

const SNIPPETS: CodeSnippet[] = [
  {
    title: 'PublicClient.get_market()',
    category: 'Gamma API',
    description: 'Fetch detailed market resolution metadata, outcomes, prices, and condition IDs.',
    code: `from polymarket import PublicClient, Market

with PublicClient() as client:
    market: Market = client.get_market(
        slug="fed-interest-rates-cut-november-2024"
    )
    print(f"Question: {market.question}")
    print(f"Condition ID: {market.condition_id}")
    print(f"Yes Price: {market.outcome_prices[0]}")
    print(f"Volume: \${market.volume:,.2f}")
`,
    mockOutput: {
      question: "Fed cuts interest rates by 25+ bps in upcoming FOMC meeting?",
      condition_id: "0x6b8f36a87c126d40026e680a6c6c59b2d287bc126dae0ea341398bb1e247475d",
      outcome_prices: [0.86, 0.14],
      volume: 18450200.0,
      active: true,
      closed: false
    }
  },
  {
    title: 'PublicClient.get_order_book()',
    category: 'CLOB API',
    description: 'Query live bids and asks ladder, spread, and midpoint on the Central Limit Order Book.',
    code: `from polymarket import PublicClient

with PublicClient() as client:
    token_id = "2174263314346390629056905015582624153306727273685674"
    book = client.get_order_book(token_id=token_id)
    midpoint = client.get_midpoint(token_id=token_id)

    print(f"Midpoint: \${midpoint}")
    print(f"Best Bid: \${book.bids[0].price} (Size: {book.bids[0].size})")
    print(f"Best Ask: \${book.asks[0].price} (Size: {book.asks[0].size})")
`,
    mockOutput: {
      midpoint: 0.855,
      spread: 0.01,
      bids: [
        { price: 0.85, size: 72000 },
        { price: 0.84, size: 48000 },
        { price: 0.83, size: 31000 }
      ],
      asks: [
        { price: 0.86, size: 64000 },
        { price: 0.87, size: 85000 },
        { price: 0.88, size: 120000 }
      ]
    }
  },
  {
    title: 'AsyncPublicClient (WebSocket / Streams)',
    category: 'Realtime Streams',
    description: 'Asynchronous streaming subscription to realtime price updates and trade events.',
    code: `import asyncio
from polymarket import AsyncPublicClient

async def stream_prices():
    async with AsyncPublicClient() as client:
        # Subscribe to realtime price events
        async for event in client.stream_realtime_prices(
            tokens=["2174263314346390629056905015582624153306727273685674"]
        ):
            print(f"[{event.timestamp}] Price: \${event.price} (Volume: {event.volume})")

# asyncio.run(stream_prices())
`,
    mockOutput: {
      status: "STREAM_SUBSCRIBED",
      channel: "clob_prices_v2",
      event: {
        token_id: "2174263314346390629056905015582624153306727273685674",
        price: 0.86,
        size: 5000,
        side: "BUY",
        timestamp: "2026-09-27T21:30:00Z"
      }
    }
  },
  {
    title: 'BTC 3-Minute Up/Down Fast Market Bot',
    category: 'Fast Beats / Binary',
    description: 'Automated 3-minute prediction market engine: lock strike price, stream 1s ticks, evaluate settlement winner.',
    code: `import time
from polymarket import PublicClient, SecureClient

# Connect to Polymarket fast crypto binary rounds
with PublicClient() as client:
    round_info = client.get_fast_market_round(asset="BTC", duration="3m")
    print(f"Round #{round_info.round_number} Strike Price: \${round_info.strike_price}")
    print(f"Seconds Remaining: {round_info.seconds_remaining}s")

    # If your quantitative signal predicts upward momentum:
    if round_info.up_multiplier >= 1.90:
        # with SecureClient(private_key="0x...") as trader:
        #     order = trader.submit_beat(
        #         round_id=round_info.round_number,
        #         direction="UP",
        #         amount_usd=100.0
        #     )
        print("Placed BEAT UP on BTC 3-Minute Round!")
`,
    mockOutput: {
      asset: "BTC/USD",
      round_number: 1082,
      duration_seconds: 180,
      strike_price: 96420.50,
      current_price: 96465.80,
      status: "ACTIVE",
      seconds_remaining: 142,
      up_pool_usd: 14250.0,
      down_pool_usd: 12800.0,
      up_multiplier: 1.95,
      down_multiplier: 2.05
    }
  },
  {
    title: 'SecureClient.create_limit_order()',
    category: 'Trading / Execution',
    description: 'Submit signed EIP-712 limit order via Polymarket CLOB exchange router.',
    code: `from polymarket import SecureClient
from decimal import Decimal

# Initialize authenticated client with Polygon signer private key
with SecureClient(private_key="0x...") as trader:
    order = trader.create_limit_order(
        token_id="2174263314346390629056905015582624153306727273685674",
        side="BUY",
        price=Decimal("0.85"),
        size=Decimal("1000")  # 1000 shares
    )
    print(f"Order ID: {order.order_id}")
    print(f"Status: {order.status}")
`,
    mockOutput: {
      order_id: "0x8fa3028c9b4e18274619a820c710293847561029384756102938475610293847",
      status: "OPEN",
      side: "BUY",
      price: "0.85",
      original_size: "1000.0",
      filled_size: "0.0",
      created_at: "2026-09-27T21:32:00Z"
    }
  },
  {
    title: 'client.merge_multiple_positions()',
    category: 'Relayer & Settlement',
    description: 'Gasless or direct batch position redemption and conditional token merging.',
    code: `from polymarket import SecureClient

with SecureClient(private_key="0x...") as client:
    # Merge regular positions by condition or market id
    handle = client.merge_multiple_positions(
        positions=[
            {"condition_id": "0x6b8f36a87c126d40026e680a6c6c59b2d287bc126dae0ea341398bb1e247475d"},
            {"market_id": "0x202b8c91d4e5f72", "amount": "max"}
        ]
    )
    outcome = handle.wait()
    print(f"Merged positions. Transaction Hash: {outcome.transaction_hash}")
`,
    mockOutput: {
      status: "SUCCESS",
      merged_positions_count: 2,
      collateral_returned_usd: "3450.00",
      transaction_hash: "0x1928374650192837465019283746501928374650192837465019283746501928"
    }
  }
];

export const ApiPlayground: React.FC = () => {
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet>(SNIPPETS[0]);
  const [consoleOutput, setConsoleOutput] = useState<any>(SNIPPETS[0].mockOutput);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setConsoleOutput(selectedSnippet.mockOutput);
      setIsRunning(false);
    }, 600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-slate-100">Polymarket Python SDK Playground</h1>
          </div>
          <p className="text-sm text-slate-400">
            Interactive reference and execution environment for <code className="text-indigo-300 font-mono">polymarket-client</code> (PyPI package).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            uv add polymarket-client
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Snippet Navigation */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            SDK Workflows & Endpoints
          </span>
          <div className="space-y-1.5">
            {SNIPPETS.map((snip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedSnippet(snip);
                  setConsoleOutput(snip.mockOutput);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-1 ${
                  selectedSnippet.title === snip.title
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-slate-100 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{snip.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                    {snip.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{snip.description}</p>
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2 mt-4">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>SDK Architecture Note</span>
            </div>
            <p className="leading-relaxed">
              The SDK gives Python developers one unified interface across Gamma API (public metadata), CLOB API (order books, trading), Data API (analytics, holders), and Relayer (gasless approvals & position merge).
            </p>
          </div>
        </div>

        {/* Right Code Editor & Output Console */}
        <div className="lg:col-span-8 space-y-4">
          {/* Code Viewer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="text-xs font-mono text-slate-400 ml-2">polymarket_example.py</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Running...' : 'Execute'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950 font-mono text-xs leading-relaxed text-slate-200 overflow-x-auto">
              <pre>{selectedSnippet.code}</pre>
            </div>
          </div>

          {/* Interactive Console Output */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-400">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Execution Output (SDK Response JSON)</span>
            </div>
            <div className="p-4 bg-slate-950 font-mono text-xs text-emerald-400 overflow-x-auto max-h-64">
              <pre>{JSON.stringify(consoleOutput, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
