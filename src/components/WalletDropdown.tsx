import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { Wallet, ArrowUpRight, RotateCcw, PlusCircle, ShieldCheck, ChevronDown, Check, Sparkles } from 'lucide-react';

export const WalletDropdown: React.FC = () => {
  const { balance, lockedInBets, totalPnl, resetBalance, depositFunds } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReset = () => {
    resetBalance(10000.00);
    triggerToast('Reset to $10,000.00 Live Balance');
  };

  const handleDeposit = (amt: number) => {
    depositFunds(amt);
    triggerToast(`Added +$${amt.toLocaleString()} to Live Wallet`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button in Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 shadow-md transition group text-left cursor-pointer"
        title="Live Polymarket Wallet Balance"
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
          <Wallet className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Live Balance
            </span>
          </div>
          <div className="text-sm font-mono font-extrabold text-emerald-400 tracking-tight leading-none">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-4 z-50 animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-200">Polymarket Live Wallet</span>
              </div>
              <p className="text-[11px] text-slate-400">Polygon Chain 137 • USDC Proxy</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              CONNECTED
            </span>
          </div>

          {/* Balance Breakdown */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Available to Trade:</span>
              <span className="text-base font-extrabold text-emerald-400">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {lockedInBets > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-900">
                <span>Locked in Active Beats:</span>
                <span className="text-amber-400 font-bold">${lockedInBets.toFixed(2)}</span>
              </div>
            )}
            {totalPnl !== 0 && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                <span className="text-slate-400">Session Realized PnL:</span>
                <span className={`font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              Quick Management
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDeposit(1000)}
                className="py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>+ $1,000</span>
              </button>
              <button
                onClick={() => handleDeposit(5000)}
                className="py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>+ $5,000</span>
              </button>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to $10,000.00 Balance</span>
            </button>
          </div>

          {/* Security & Network note */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Gasless CLOB Router v2
            </span>
            <span className="font-mono">Vault 0x7a...90f</span>
          </div>

          {toastMessage && (
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono text-center animate-fade-in flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>{toastMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
