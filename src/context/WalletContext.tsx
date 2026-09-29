import React, { createContext, useContext, useState, useEffect } from 'react';

interface WalletContextType {
  balance: number;
  lockedInBets: number;
  totalPnl: number;
  deductFunds: (amount: number) => boolean;
  addFunds: (amount: number, isProfit?: boolean) => void;
  resetBalance: (newBalance?: number) => void;
  depositFunds: (amount: number) => void;
  lockFunds: (amount: number) => boolean;
  unlockFunds: (amount: number) => void;
}

const DEFAULT_BALANCE = 10000.00;
const STORAGE_KEY = 'polymarket_live_wallet_balance_v1';

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch {}
    return DEFAULT_BALANCE;
  });

  const [lockedInBets, setLockedInBets] = useState<number>(0);
  const [totalPnl, setTotalPnl] = useState<number>(0);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, balance.toString());
    } catch {}
  }, [balance]);

  const deductFunds = (amount: number): boolean => {
    if (amount <= 0) return false;
    if (balance < amount) return false;
    setBalance((prev) => +(prev - amount).toFixed(2));
    return true;
  };

  const addFunds = (amount: number, isProfit: boolean = false) => {
    if (amount <= 0) return;
    setBalance((prev) => +(prev + amount).toFixed(2));
    if (isProfit) {
      setTotalPnl((prev) => +(prev + amount).toFixed(2));
    }
  };

  const depositFunds = (amount: number) => {
    if (amount <= 0) return;
    setBalance((prev) => +(prev + amount).toFixed(2));
  };

  const resetBalance = (newBalance: number = DEFAULT_BALANCE) => {
    setBalance(newBalance);
    setLockedInBets(0);
    setTotalPnl(0);
  };

  const lockFunds = (amount: number): boolean => {
    if (balance < amount) return false;
    setBalance((prev) => +(prev - amount).toFixed(2));
    setLockedInBets((prev) => +(prev + amount).toFixed(2));
    return true;
  };

  const unlockFunds = (amount: number) => {
    setLockedInBets((prev) => Math.max(0, +(prev - amount).toFixed(2)));
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        lockedInBets,
        totalPnl,
        deductFunds,
        addFunds,
        resetBalance,
        depositFunds,
        lockFunds,
        unlockFunds,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
