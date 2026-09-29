import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PricePoint, BeatPrediction, BeatRound, BeatHistoryItem, UserBeat, BtcPriceAlert } from '../types';
import { BtcLiveChart } from './BtcLiveChart';
import { sounds } from '../utils/audio';
import { useWallet } from '../context/WalletContext';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code2,
  ArrowRight,
  ShieldCheck,
  Award,
  Flame,
  ChevronRight,
  RefreshCw,
  Bell,
  Radio,
  Sliders,
  X,
  Activity,
  Sparkles,
  AlertTriangle,
  FastForward,
  Play,
  Pause,
  Timer,
  ExternalLink
} from 'lucide-react';

const ROUND_DURATION_SECONDS = 180; // 3 minutes
const HOLD_DURATION_SECONDS = 6; // 6 seconds live hold for oracle settlement determination
const NEXT_ROUND_DELAY_SECONDS = 5; // 5 seconds live review before next round iteration

export const BtcBeatGame: React.FC = () => {
  // Live Wallet Balance ($10,000.00 initial default)
  const { balance, deductFunds, addFunds, resetBalance } = useWallet();
  const [stakeAmount, setStakeAmount] = useState<number>(100);
  const [selectedSide, setSelectedSide] = useState<BeatPrediction>('UP');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Live Price State (default $84,389.87)
  const [currentPrice, setCurrentPrice] = useState<number>(84389.87);
  const currentPriceRef = useRef<number>(84389.87);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [high24h, setHigh24h] = useState<number>(85900);
  const [low24h, setLow24h] = useState<number>(83100);
  const [change24h, setChange24h] = useState<number>(2.85);

  // Live Ticker & Snap
  const [liveSnapTrigger, setLiveSnapTrigger] = useState<number>(0);
  const [liveSyncMessage, setLiveSyncMessage] = useState<string | null>(null);
  const [polymarketOdds, setPolymarketOdds] = useState<number>(68.4);
  const [oracleLatency, setOracleLatency] = useState<number>(38);

  // Keep currentPriceRef updated with latest currentPrice
  useEffect(() => {
    currentPriceRef.current = currentPrice;
  }, [currentPrice]);

  // Live Alerts from Polymarket
  const [alerts, setAlerts] = useState<BtcPriceAlert[]>([
    {
      id: 'alert_init_1',
      type: 'POLYMARKET_ORACLE',
      title: 'Polymarket Oracle Connected',
      message: 'Chainlink & CLOB live feed streaming on Polygon Chain 137',
      price: 84389.87,
      timeStr: new Date(Date.now() - 40000).toLocaleTimeString('en-US', { hour12: false }),
      minutesSeconds: '02:20 remaining (00:40 in round)',
      direction: 'NEUTRAL',
      timestamp: Date.now() - 40000
    }
  ]);
  const [latestAlert, setLatestAlert] = useState<BtcPriceAlert | null>(null);
  const [showAlertsModal, setShowAlertsModal] = useState<boolean>(false);
  const [customTargetPrice, setCustomTargetPrice] = useState<string>('');
  const [customTargetAlertSet, setCustomTargetAlertSet] = useState<number | null>(null);

  // Tracking previous price to detect crosses & spikes
  const prevPriceRef = useRef<number>(84389.87);

  // Round State
  const [roundNumber, setRoundNumber] = useState<number>(1082);
  const [roundStatus, setRoundStatus] = useState<'ACTIVE' | 'HOLD_DETERMINING_WINNER' | 'RESOLVED'>('ACTIVE');
  const [strikePrice, setStrikePrice] = useState<number>(84389.87);
  const [settlementPrice, setSettlementPrice] = useState<number | undefined>(undefined);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(ROUND_DURATION_SECONDS);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number>(HOLD_DURATION_SECONDS);
  const [transitionSecondsRemaining, setTransitionSecondsRemaining] = useState<number>(NEXT_ROUND_DELAY_SECONDS);
  const [autoIterate, setAutoIterate] = useState<boolean>(true);
  const [iterationCount, setIterationCount] = useState<number>(1);
  const [oracleSamples, setOracleSamples] = useState<Array<{ tick: number; price: number; timeStr: string }>>([]);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [winner, setWinner] = useState<BeatPrediction | 'DRAW' | undefined>(undefined);

  // Active Beat for this round
  const [activeBeat, setActiveBeat] = useState<UserBeat | null>(null);

  // Pool values
  const [upPool, setUpPool] = useState<number>(14250);
  const [downPool, setDownPool] = useState<number>(12800);

  // Resolution and Transition Refs to avoid race conditions or duplicates
  const resolvingRoundRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextRoundTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // History of completed rounds
  const [roundHistory, setRoundHistory] = useState<BeatHistoryItem[]>([
    {
      roundNumber: 1081,
      timestamp: '3 mins ago',
      strikePrice: 84350.00,
      settlementPrice: 84389.87,
      diff: 39.87,
      winner: 'UP',
      userPrediction: 'UP',
      userPnl: 47.50,
      userResult: 'WIN'
    },
    {
      roundNumber: 1080,
      timestamp: '6 mins ago',
      strikePrice: 84420.20,
      settlementPrice: 84350.00,
      diff: -70.20,
      winner: 'DOWN',
      userPrediction: 'DOWN',
      userPnl: 45.00,
      userResult: 'WIN'
    },
    {
      roundNumber: 1079,
      timestamp: '9 mins ago',
      strikePrice: 84310.00,
      settlementPrice: 84420.20,
      diff: 110.20,
      winner: 'UP',
      userPrediction: 'DOWN',
      userPnl: -50.00,
      userResult: 'LOSS'
    }
  ]);

  // Audio mute toggle sync
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Check price alerts on each tick
  const checkPriceAlerts = useCallback(
    (newPrice: number, remaining: number) => {
      const prev = prevPriceRef.current;
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
      const elapsedSecs = ROUND_DURATION_SECONDS - remaining;
      const minsSecs = `${formatTime(remaining)} remaining (${formatTime(elapsedSecs)} in round)`;

      // 1. Strike price cross alert
      if (prev < strikePrice && newPrice >= strikePrice) {
        const diff = +(newPrice - strikePrice).toFixed(2);
        const alertItem: BtcPriceAlert = {
          id: `alert_cross_up_${Date.now()}`,
          type: 'STRIKE_CROSS',
          title: 'Polymarket Strike Breached UP!',
          message: `BTC surged above Strike $${strikePrice.toFixed(2)} to $${newPrice.toFixed(2)} (+ $${diff})`,
          price: newPrice,
          timeStr,
          minutesSeconds: minsSecs,
          direction: 'UP',
          timestamp: Date.now()
        };
        setAlerts((a) => [alertItem, ...a.slice(0, 19)]);
        setLatestAlert(alertItem);
        if (soundEnabled) sounds.playTick(1200);
      } else if (prev >= strikePrice && newPrice < strikePrice) {
        const diff = +(strikePrice - newPrice).toFixed(2);
        const alertItem: BtcPriceAlert = {
          id: `alert_cross_down_${Date.now()}`,
          type: 'STRIKE_CROSS',
          title: 'Polymarket Strike Breached DOWN!',
          message: `BTC dropped below Strike $${strikePrice.toFixed(2)} to $${newPrice.toFixed(2)} (- $${diff})`,
          price: newPrice,
          timeStr,
          minutesSeconds: minsSecs,
          direction: 'DOWN',
          timestamp: Date.now()
        };
        setAlerts((a) => [alertItem, ...a.slice(0, 19)]);
        setLatestAlert(alertItem);
        if (soundEnabled) sounds.playTick(600);
      }

      // 2. Custom target price alert
      if (customTargetAlertSet !== null) {
        const target = customTargetAlertSet;
        if ((prev < target && newPrice >= target) || (prev > target && newPrice <= target)) {
          const alertItem: BtcPriceAlert = {
            id: `alert_target_${Date.now()}`,
            type: 'TARGET_REACHED',
            title: `🎯 Target Alert Hit: $${target.toFixed(2)}!`,
            message: `BTC reached your target price of $${target.toFixed(2)} (Current: $${newPrice.toFixed(2)})`,
            price: newPrice,
            timeStr,
            minutesSeconds: minsSecs,
            direction: newPrice >= strikePrice ? 'UP' : 'DOWN',
            timestamp: Date.now()
          };
          setAlerts((a) => [alertItem, ...a.slice(0, 19)]);
          setLatestAlert(alertItem);
          setCustomTargetAlertSet(null);
          if (soundEnabled) sounds.playWin();
        }
      }

      prevPriceRef.current = newPrice;
    },
    [strikePrice, customTargetAlertSet, soundEnabled]
  );

  // Handle "GO TO LIVE" click
  const handleGoToLive = () => {
    setLiveSnapTrigger(Date.now());
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    const elapsedSecs = ROUND_DURATION_SECONDS - secondsRemaining;
    const minsSecs = `${formatTime(secondsRemaining)} remaining (${formatTime(elapsedSecs)} in round)`;
    setLiveSyncMessage(`LIVE STREAM SYNCED • Time: ${timeStr} • ${minsSecs}`);
    setTimeout(() => setLiveSyncMessage(null), 3500);

    fetch('/api/crypto/btc')
      .then((res) => res.json())
      .then((data) => {
        if (data.price) {
          setCurrentPrice(data.price);
          if (data.polymarketOracle?.latencyMs) setOracleLatency(data.polymarketOracle.latencyMs);
          if (data.polymarketOracle?.btc100kProbability) {
            setPolymarketOdds(+(data.polymarketOracle.btc100kProbability * 100).toFixed(1));
          }
          checkPriceAlerts(data.price, secondsRemaining);
        }
      })
      .catch(() => {});

    if (soundEnabled) sounds.playTick(1100);
  };

  // 1. Initial price history generation
  useEffect(() => {
    const initialPoints: PricePoint[] = [];
    const now = Date.now();
    let price = currentPrice;

    for (let i = 60; i >= 0; i--) {
      price += (Math.random() - 0.495) * 6;
      initialPoints.push({
        time: now - i * 1000,
        price: +price.toFixed(2),
        open: +(price - (Math.random() - 0.5) * 3).toFixed(2),
        close: +price.toFixed(2),
        high: +(price + Math.random() * 4).toFixed(2),
        low: +(price - Math.random() * 4).toFixed(2),
      });
    }

    setPriceHistory(initialPoints);
    setStrikePrice(initialPoints[0].price);
  }, []);

  // 2. Fetch live price from server /api/crypto/btc periodically
  useEffect(() => {
    const fetchBtc = async () => {
      try {
        const res = await fetch('/api/crypto/btc');
        if (res.ok) {
          const data = await res.json();
          if (data.price) {
            setCurrentPrice(data.price);
            if (data.high24h) setHigh24h(data.high24h);
            if (data.low24h) setLow24h(data.low24h);
            if (data.change24h) setChange24h(data.change24h);
          }
        }
      } catch {
        // local simulation will keep ticking
      }
    };

    fetchBtc();
    const pollInterval = setInterval(fetchBtc, 3000);
    return () => clearInterval(pollInterval);
  }, []);

  // 3. High-frequency 1-second price ticker & history appender
  useEffect(() => {
    const tickInterval = setInterval(() => {
      const prev = currentPriceRef.current;
      const delta = (Math.random() - 0.492) * (Math.random() > 0.85 ? 12 : 3.5);
      const next = +(prev + delta).toFixed(2);
      currentPriceRef.current = next;

      setCurrentPrice(next);

      checkPriceAlerts(next, secondsRemaining);

      setPriceHistory((hist) => {
        const now = Date.now();
        const lastPoint = hist[hist.length - 1];
        const newPoint: PricePoint = {
          time: now,
          price: next,
          open: lastPoint ? lastPoint.close : next,
          close: next,
          high: Math.max(lastPoint?.close ?? next, next) + Math.random() * 1.5,
          low: Math.min(lastPoint?.close ?? next, next) - Math.random() * 1.5,
        };
        // Keep up to 180 points (full 3 minutes of 1s ticks)
        return [...hist.slice(-180), newPoint];
      });
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [checkPriceAlerts, secondsRemaining]);

  // Multiplier calculation based on pools (e.g. 1.95x fair standard)
  const totalPool = upPool + downPool;
  const upMultiplier = +(Math.max(1.1, (totalPool * 0.98) / Math.max(upPool, 100))).toFixed(2);
  const downMultiplier = +(Math.max(1.1, (totalPool * 0.98) / Math.max(downPool, 100))).toFixed(2);

  // Clean up any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current);
    };
  }, []);

  // "After 3 minutes hold on determining a winner" workflow:
  const handleTriggerHoldOnDeterminingWinner = useCallback(() => {
    // Avoid double execution for the same round
    if (resolvingRoundRef.current === roundNumber) {
      return;
    }
    resolvingRoundRef.current = roundNumber;

    setRoundStatus('HOLD_DETERMINING_WINNER');
    setHoldSecondsRemaining(HOLD_DURATION_SECONDS);

    if (soundEnabled) {
      sounds.playHoldTension();
    }

    // Capture the final settlement tick at exactly 3 minutes
    const finalPrice = currentPriceRef.current;
    setSettlementPrice(finalPrice);

    // Initial oracle sample tick
    const now = new Date();
    setOracleSamples([
      {
        tick: 1,
        price: finalPrice,
        timeStr: now.toLocaleTimeString('en-US', { hour12: false })
      }
    ]);
  }, [roundNumber, soundEnabled]);

  // 4. MAIN 3-MINUTE TICKING ENGINE
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (roundStatus === 'ACTIVE') {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            return 0;
          }

          // Audio tick in last 5 seconds of 3-minute round
          if (prev <= 6 && soundEnabled) {
            sounds.playTick(prev % 2 === 0 ? 880 : 960);
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [roundStatus, soundEnabled]);

  // When 3 minutes completes (secondsRemaining hits 0), trigger hold phase cleanly in effect
  useEffect(() => {
    if (roundStatus === 'ACTIVE' && secondsRemaining === 0) {
      handleTriggerHoldOnDeterminingWinner();
    }
  }, [roundStatus, secondsRemaining, handleTriggerHoldOnDeterminingWinner]);

  // Final resolution after hold countdown finishes
  const handleCompleteHoldResolution = useCallback(() => {
    const finalPrice = settlementPrice ?? currentPriceRef.current;
    let determinedWinner: BeatPrediction | 'DRAW' = 'DRAW';
    const diff = +(finalPrice - strikePrice).toFixed(2);

    if (diff > 0) {
      determinedWinner = 'UP';
    } else if (diff < 0) {
      determinedWinner = 'DOWN';
    } else {
      determinedWinner = 'DRAW';
    }

    setWinner(determinedWinner);
    setRoundStatus('RESOLVED');
    setTransitionSecondsRemaining(NEXT_ROUND_DELAY_SECONDS);

    // Check user beat outcome
    let userRes: 'WIN' | 'LOSS' | undefined;
    let userPnl = 0;

    if (activeBeat) {
      if (activeBeat.prediction === determinedWinner) {
        userRes = 'WIN';
        const payout = activeBeat.potentialPayout;
        userPnl = +(payout - activeBeat.amount).toFixed(2);
        addFunds(payout, true);
        if (soundEnabled) sounds.playWin();
      } else {
        userRes = 'LOSS';
        userPnl = -activeBeat.amount;
        if (soundEnabled) sounds.playLoss();
      }
    }

    // Add to Round History (deduplicated by roundNumber)
    setRoundHistory((prev) => {
      const filtered = prev.filter((p) => p.roundNumber !== roundNumber);
      return [
        {
          roundNumber: roundNumber,
          timestamp: 'Just now',
          strikePrice: strikePrice,
          settlementPrice: finalPrice,
          diff: diff,
          winner: determinedWinner,
          userPrediction: activeBeat?.prediction,
          userPnl: userPnl,
          userResult: userRes
        },
        ...filtered.slice(0, 9)
      ];
    });
  }, [settlementPrice, strikePrice, activeBeat, roundNumber, soundEnabled, addFunds]);

  // 5. LIVE HOLD TICKING ENGINE (after 3 minutes ends, ticks countdown to determination)
  useEffect(() => {
    let holdInterval: NodeJS.Timeout;

    if (roundStatus === 'HOLD_DETERMINING_WINNER') {
      holdInterval = setInterval(() => {
        setHoldSecondsRemaining((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(holdInterval);
  }, [roundStatus]);

  // Record live oracle sample ticks during hold phase
  useEffect(() => {
    if (roundStatus !== 'HOLD_DETERMINING_WINNER') return;
    const tickIndex = HOLD_DURATION_SECONDS - holdSecondsRemaining;
    if (tickIndex > 0) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
      setOracleSamples((samples) => [
        ...samples.slice(-4),
        {
          tick: tickIndex,
          price: currentPriceRef.current,
          timeStr
        }
      ]);

      if (soundEnabled) {
        sounds.playTick(1000 + tickIndex * 80);
      }
    }
  }, [roundStatus, holdSecondsRemaining, soundEnabled]);

  // When hold countdown reaches 0, trigger final resolution safely in effect
  useEffect(() => {
    if (roundStatus === 'HOLD_DETERMINING_WINNER' && holdSecondsRemaining === 0) {
      handleCompleteHoldResolution();
    }
  }, [roundStatus, holdSecondsRemaining, handleCompleteHoldResolution]);

  // 6. LIVE TRANSITION & ITERATION TICKING ENGINE (iterates to next 3-minute round)
  useEffect(() => {
    let transitionInterval: NodeJS.Timeout;

    if (roundStatus === 'RESOLVED' && autoIterate) {
      transitionInterval = setInterval(() => {
        setTransitionSecondsRemaining((prev) => {
          if (prev <= 1) {
            return 0;
          }
          if (soundEnabled && prev <= 3) {
            sounds.playTick(720);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(transitionInterval);
  }, [roundStatus, autoIterate, soundEnabled]);

  // When transition countdown reaches 0, automatically start next round cleanly in effect
  useEffect(() => {
    if (roundStatus === 'RESOLVED' && autoIterate && transitionSecondsRemaining === 0) {
      startNextRound();
    }
  }, [roundStatus, autoIterate, transitionSecondsRemaining]);

  // Fast forward helper to immediately test 3-min end and hold ticking
  const handleFastForwardTo3MinHold = () => {
    if (roundStatus === 'ACTIVE') {
      setSecondsRemaining(1);
    }
  };

  // Start next 3-minute round (Iterates cleanly)
  const startNextRound = (newStrike?: number) => {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current);
    resolvingRoundRef.current = null;

    const nextStrike = newStrike ?? currentPrice;
    setRoundNumber((r) => r + 1);
    setIterationCount((c) => c + 1);
    setStrikePrice(nextStrike);
    setSettlementPrice(undefined);
    setWinner(undefined);
    setActiveBeat(null);
    setSecondsRemaining(ROUND_DURATION_SECONDS);
    setHoldSecondsRemaining(HOLD_DURATION_SECONDS);
    setTransitionSecondsRemaining(NEXT_ROUND_DELAY_SECONDS);
    setOracleSamples([]);
    setRoundStartTime(Date.now());
    setUpPool(Math.round(10000 + Math.random() * 8000));
    setDownPool(Math.round(10000 + Math.random() * 8000));
    setRoundStatus('ACTIVE');
    if (soundEnabled) sounds.playTick(1200);
  };

  // Place a Beat (UP or DOWN)
  const handlePlaceBeat = (side: BeatPrediction) => {
    if (roundStatus !== 'ACTIVE') return;
    if (stakeAmount <= 0) return;
    if (!deductFunds(stakeAmount)) {
      alert(`Insufficient funds in Live Wallet ($${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}). Reset to $10,000.00 or deposit!`);
      return;
    }

    const multiplier = side === 'UP' ? upMultiplier : downMultiplier;
    const potentialPayout = +(stakeAmount * multiplier).toFixed(2);

    const beat: UserBeat = {
      id: `beat_${Date.now()}`,
      prediction: side,
      amount: stakeAmount,
      multiplier: multiplier,
      potentialPayout: potentialPayout,
      placedAt: Date.now()
    };

    setActiveBeat(beat);

    // Update pool
    if (side === 'UP') {
      setUpPool((p) => p + stakeAmount);
    } else {
      setDownPool((p) => p + stakeAmount);
    }

    if (soundEnabled) sounds.playTick(1200);
  };

  // Circular timer math dynamically adapting to active round, hold phase, or transition phase
  const progressPercent =
    roundStatus === 'ACTIVE'
      ? ((ROUND_DURATION_SECONDS - secondsRemaining) / ROUND_DURATION_SECONDS) * 100
      : roundStatus === 'HOLD_DETERMINING_WINNER'
      ? ((HOLD_DURATION_SECONDS - holdSecondsRemaining) / HOLD_DURATION_SECONDS) * 100
      : ((NEXT_ROUND_DELAY_SECONDS - transitionSecondsRemaining) / NEXT_ROUND_DELAY_SECONDS) * 100;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const displaySeconds =
    roundStatus === 'ACTIVE'
      ? secondsRemaining
      : roundStatus === 'HOLD_DETERMINING_WINNER'
      ? holdSecondsRemaining
      : transitionSecondsRemaining;

  const displayTimerLabel =
    roundStatus === 'ACTIVE'
      ? 'MM : SS'
      : roundStatus === 'HOLD_DETERMINING_WINNER'
      ? 'HOLD TICK'
      : 'ITERATING';

  // Active status helper
  const isUpLeading = currentPrice >= strikePrice;
  const activeBeatWinning = activeBeat
    ? (activeBeat.prediction === 'UP' && isUpLeading) || (activeBeat.prediction === 'DOWN' && !isUpLeading)
    : false;

  // Stats calculation
  const totalRoundsPlayed = roundHistory.filter((h) => h.userPrediction).length;
  const totalWins = roundHistory.filter((h) => h.userResult === 'WIN').length;
  const winRate = totalRoundsPlayed > 0 ? Math.round((totalWins / totalRoundsPlayed) * 100) : 0;
  const totalProfit = roundHistory.reduce((acc, h) => acc + (h.userPnl || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="font-extrabold text-white text-2xl">₿</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
                BTC 3-Minute Up or Down Beat
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ROUND #{roundNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Will BTC finish UP or DOWN after 3 minutes? Seconds ticking down in real time.
            </p>
          </div>
        </div>

        {/* Live Wallet Balance & Audio Controls */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-right">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-end gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Wallet Balance</span>
            </div>
            <div className="text-lg font-mono font-extrabold text-emerald-400">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <button
            onClick={() => resetBalance(10000)}
            title="Reset Live Wallet Balance to $10,000.00"
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className={`p-2.5 rounded-xl border transition ${
              soundEnabled
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Grid: Chart & 3-Minute Beat Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Live BTC Chart */}
        <div className="lg:col-span-8 space-y-4">
          <BtcLiveChart
            priceHistory={priceHistory}
            currentPrice={currentPrice}
            strikePrice={strikePrice}
            roundStartTime={roundStartTime}
            durationSeconds={ROUND_DURATION_SECONDS}
            isHoldPhase={roundStatus === 'HOLD_DETERMINING_WINNER'}
            winner={winner}
            settlementPrice={settlementPrice}
            liveSnapTrigger={liveSnapTrigger}
          />

          {/* Quick Round Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-slate-400 text-xs block">Strike Price</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                ${strikePrice.toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-slate-400 text-xs block">Total Round Pool</span>
              <span className="font-mono font-bold text-slate-200 text-sm">
                ${totalPool.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-slate-400 text-xs block">UP Staked</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                ${upPool.toLocaleString()} ({upMultiplier}x)
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-slate-400 text-xs block">DOWN Staked</span>
              <span className="font-mono font-bold text-rose-400 text-sm">
                ${downPool.toLocaleString()} ({downMultiplier}x)
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): 3-Minute Ticking Timer & Beat Execution */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          {/* 3-Minute Countdown Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  3-Min Round Timer
                </span>
              </div>

              {/* GO TO LIVE button and Status Badge in 3-MIN ROUND TIMER */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleGoToLive}
                  title="Snap to live price tick and sync Polymarket feed"
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold font-mono transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>GO TO LIVE</span>
                </button>

                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    roundStatus === 'ACTIVE'
                      ? secondsRemaining <= 30
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      : roundStatus === 'HOLD_DETERMINING_WINNER'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {roundStatus === 'ACTIVE'
                    ? secondsRemaining <= 30
                      ? 'CLOSING'
                      : 'TICKING'
                    : roundStatus === 'HOLD_DETERMINING_WINNER'
                    ? 'HOLDING'
                    : 'RESOLVED'}
                </span>
              </div>
            </div>

            {/* Circular Timer Visual with Minutes and Seconds */}
            <div className="flex items-center justify-center gap-6 py-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke="#1e293b"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke={
                      roundStatus === 'HOLD_DETERMINING_WINNER'
                        ? '#F59E0B'
                        : roundStatus === 'RESOLVED'
                        ? '#10B981'
                        : secondsRemaining <= 30
                        ? '#F43F5E'
                        : '#3B82F6'
                    }
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span
                    className={`font-mono text-2xl font-black tracking-tight ${
                      roundStatus === 'HOLD_DETERMINING_WINNER'
                        ? 'text-amber-400 animate-pulse'
                        : roundStatus === 'RESOLVED'
                        ? 'text-emerald-400'
                        : secondsRemaining <= 30
                        ? 'text-rose-400 animate-pulse'
                        : 'text-slate-100'
                    }`}
                  >
                    {formatTime(displaySeconds)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{displayTimerLabel}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="text-slate-400">
                  Round: <strong className="text-slate-200">#{roundNumber}</strong>
                  <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-blue-300">
                    Iter #{iterationCount}
                  </span>
                </div>
                <div className="text-slate-400">
                  Period: <strong className="text-slate-200">3 Minutes</strong>
                </div>
                <div className="text-slate-400">
                  {roundStatus === 'HOLD_DETERMINING_WINNER' ? (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      Hold Locking: 00:0{holdSecondsRemaining}
                    </span>
                  ) : roundStatus === 'RESOLVED' ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Iterating: 00:0{transitionSecondsRemaining}
                    </span>
                  ) : (
                    <>
                      Leading:{' '}
                      <span
                        className={`font-bold font-mono ${
                          isUpLeading ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isUpLeading ? 'UP 🟢' : 'DOWN 🔴'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Fast Forward test button for 3-minute completion */}
            {roundStatus === 'ACTIVE' && (
              <div className="flex justify-end pt-0.5">
                <button
                  onClick={handleFastForwardTo3MinHold}
                  title="Instantly jump to last 3 seconds of the 3-minute period to test live hold ticking & iteration"
                  className="text-[10px] font-mono font-semibold text-slate-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
                >
                  <FastForward className="w-3 h-3 text-amber-400" />
                  <span>Fast-Forward to 3-Min End (3s left)</span>
                </button>
              </div>
            )}

            {/* Live Ticker Bar in Module 3-MIN ROUND TIMER */}
            <div className="mt-3 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-slate-200">LIVE TICKER</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  ● Synced ({oracleLatency}ms)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-bold">BTC/USD</span>
                  <span className={`text-sm font-extrabold ${isUpLeading ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${currentPrice.toFixed(2)}
                  </span>
                </div>
                <span className={`text-xs font-bold ${isUpLeading ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUpLeading ? '▲ +' : '▼ -'}${Math.abs(currentPrice - strikePrice).toFixed(2)}
                </span>
              </div>
              <div className="mt-1 pt-1 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
                <span>Polymarket Odds: <strong className="text-blue-400">{polymarketOdds}%</strong></span>
                <span className="flex items-center gap-1">
                  <span>Resolution:</span>
                  <a
                    href="https://data.chain.link/streams/btc-usd-twap-60s-streams"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline font-semibold flex items-center gap-0.5"
                  >
                    <span>Chainlink Streams</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
                </span>
              </div>
            </div>

            {/* Live BTC Price Alert from Polymarket with Time & Minutes in Module 3-MIN ROUND TIMER */}
            <div className="mt-3 p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                  <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  <span>POLYMARKET PRICE ALERT</span>
                </div>
                <button
                  onClick={() => setShowAlertsModal(true)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-200 underline font-medium cursor-pointer"
                >
                  Alerts ({alerts.length})
                </button>
              </div>

              {latestAlert ? (
                <div className="text-[11px] text-slate-200 leading-snug">
                  <div className="font-semibold text-slate-100 flex items-center gap-1">
                    <span>{latestAlert.direction === 'UP' ? '🟢' : latestAlert.direction === 'DOWN' ? '🔴' : 'ℹ️'}</span>
                    <span>{latestAlert.title}</span>
                  </div>
                  <p className="text-slate-300 text-[10.5px] mt-0.5">{latestAlert.message}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-indigo-950/60">
                    <span>Time: <strong className="text-slate-200">{latestAlert.timeStr}</strong></span>
                    <span className="text-amber-300 font-semibold">{latestAlert.minutesSeconds}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-300 leading-snug">
                  <div className="font-semibold text-slate-100 flex items-center gap-1">
                    <span>🟢</span>
                    <span>Polymarket Oracle Tracking BTC</span>
                  </div>
                  <p className="text-slate-400 text-[10.5px] mt-0.5">
                    Strike: ${strikePrice.toFixed(2)} • Ready for price alerts on strike breach or target hits.
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-indigo-950/60">
                    <span>Time: <strong className="text-slate-200">{new Date().toLocaleTimeString('en-US', { hour12: false })}</strong></span>
                    <span className="text-amber-300 font-semibold">{formatTime(secondsRemaining)} remaining</span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Sync Confirmation Toast */}
            {liveSyncMessage && (
              <div className="mt-2.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono text-center animate-fade-in flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{liveSyncMessage}</span>
              </div>
            )}

            {/* Hold on determining winner announcement with live ticking seconds & oracle verification */}
            {roundStatus === 'HOLD_DETERMINING_WINNER' && (
              <div className="mt-4 p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-xl space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Hold on, determining winner...</span>
                  </div>
                  <span className="font-mono font-extrabold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 text-xs">
                    00:0{holdSecondsRemaining}
                  </span>
                </div>

                <div className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
                  Bitcoin Up or Down
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  This market has ended. Final resolution will appear automatically as soon as it is available on-chain.
                </p>

                {/* Live Oracle Sample Verification Bars */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: HOLD_DURATION_SECONDS }).map((_, i) => {
                      const isSampled = i < (HOLD_DURATION_SECONDS - holdSecondsRemaining);
                      const isCurrent = i === (HOLD_DURATION_SECONDS - holdSecondsRemaining);
                      return (
                        <div
                          key={i}
                          className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                            isSampled
                              ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                              : isCurrent
                              ? 'bg-amber-300 animate-pulse ring-1 ring-amber-400'
                              : 'bg-slate-800'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Oracle Ticks: {Math.max(1, HOLD_DURATION_SECONDS - holdSecondsRemaining)}/{HOLD_DURATION_SECONDS} verified</span>
                    <span className="text-amber-300 font-semibold">{holdSecondsRemaining}s ticking down</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-500/20 text-[11px] text-slate-400 flex flex-col items-start gap-1 font-mono">
                  <span className="text-slate-400 font-semibold">Resolution Source:</span>
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
            )}

            {/* Resolved Winner Card with Next Round Iteration Countdown */}
            {roundStatus === 'RESOLVED' && winner && (
              <div
                className={`mt-4 p-4 rounded-xl border text-center space-y-2.5 animate-fade-in ${
                  winner === 'UP'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : winner === 'DOWN'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="text-base font-extrabold flex items-center justify-center gap-2">
                  <Award className="w-5 h-5" />
                  <span>WINNER: {winner} BEAT!</span>
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  Settlement: ${settlementPrice?.toFixed(2)} ({settlementPrice && settlementPrice >= strikePrice ? '+' : ''}
                  {settlementPrice ? (settlementPrice - strikePrice).toFixed(2) : 0})
                </div>
                {activeBeat && (
                  <div className="text-xs font-semibold pt-1 border-t border-slate-800">
                    {activeBeat.prediction === winner ? (
                      <span className="text-emerald-400">
                        🎉 You Won +${(activeBeat.potentialPayout - activeBeat.amount).toFixed(2)}!
                      </span>
                    ) : (
                      <span className="text-rose-400">
                        Better luck next round (-${activeBeat.amount.toFixed(2)})
                      </span>
                    )}
                  </div>
                )}

                {/* Live Iterating Countdown to Next 3-Minute Round */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    <span>Iterating to Round #{roundNumber + 1} in:</span>
                  </div>
                  <span className="font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                    00:0{transitionSecondsRemaining}
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => startNextRound()}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-md cursor-pointer"
                  >
                    <span>Start Round #{roundNumber + 1} Now</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setAutoIterate(!autoIterate)}
                    title={autoIterate ? 'Pause auto-iteration' : 'Enable auto-iteration'}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      autoIterate
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {autoIterate ? 'Auto: ON' : 'Auto: PAUSED'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Beat Placement Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex-1 flex flex-col justify-between space-y-4">
            {roundStatus === 'HOLD_DETERMINING_WINNER' ? (
              <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-6 text-center space-y-4 my-auto animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                  <RefreshCw className="w-7 h-7 animate-spin" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-amber-300 tracking-tight">
                    Hold on, determining winner...
                  </h3>
                  <div className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
                    Bitcoin Up or Down
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5 text-left">
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    This market has ended. Final resolution will appear automatically as soon as it is available on-chain.
                  </p>
                  
                  <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800 text-slate-300">
                    <span className="text-slate-400">Locking Settlement:</span>
                    <span className="font-extrabold text-amber-300">${(settlementPrice ?? currentPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="text-slate-400">Strike Price:</span>
                    <span className="font-extrabold text-slate-200">${strikePrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-500/20 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-1.5 font-mono">
                  <span className="text-slate-400 font-semibold">Resolution Source:</span>
                  <a
                    href="https://data.chain.link/streams/btc-usd-twap-60s-streams"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 font-bold break-all"
                  >
                    <span>data.chain.link/streams/btc-usd-twap-60s-streams</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h3 className="font-bold text-slate-100 text-sm">Place Your 3M Beat</h3>
                  <span className="text-xs text-slate-400">Polymarket Fast CLOB</span>
                </div>

                {/* Stake input & quick pills */}
                <div className="space-y-2 mb-4">
                  <label className="block text-xs font-medium text-slate-400">Stake Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                    <input
                      type="number"
                      min="1"
                      max={balance}
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(Math.max(1, Number(e.target.value)))}
                      disabled={roundStatus !== 'ACTIVE'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[50, 100, 250, 500, 1000, 2500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        disabled={roundStatus !== 'ACTIVE'}
                        onClick={() => setStakeAmount(amt)}
                        className={`flex-1 min-w-[50px] py-1 rounded-lg text-xs font-medium transition border ${
                          stakeAmount === amt
                            ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={roundStatus !== 'ACTIVE'}
                      onClick={() => setStakeAmount(Math.min(5000, Math.floor(balance)))}
                      className="py-1 px-2.5 rounded-lg text-xs font-bold transition border bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* 2 Big Action Buttons: UP or DOWN */}
                <div className="grid grid-cols-2 gap-3">
                  {/* BEAT UP */}
                  <button
                    type="button"
                    disabled={roundStatus !== 'ACTIVE' || activeBeat !== null}
                    onClick={() => handlePlaceBeat('UP')}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition shadow-lg relative group ${
                      activeBeat?.prediction === 'UP'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                        : 'bg-emerald-950/30 hover:bg-emerald-900/40 border-emerald-800/60 text-emerald-400'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <TrendingUp className="w-6 h-6 mb-1 text-emerald-400 group-hover:scale-110 transition" />
                    <span className="font-extrabold text-sm tracking-wide">BEAT UP</span>
                    <span className="text-xs font-mono font-semibold text-emerald-300 mt-1">
                      {upMultiplier}x Payout
                    </span>
                    <span className="text-[10px] text-emerald-500/90 mt-0.5">
                      Wins +${(stakeAmount * upMultiplier - stakeAmount).toFixed(1)}
                    </span>
                  </button>

                  {/* BEAT DOWN */}
                  <button
                    type="button"
                    disabled={roundStatus !== 'ACTIVE' || activeBeat !== null}
                    onClick={() => handlePlaceBeat('DOWN')}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition shadow-lg relative group ${
                      activeBeat?.prediction === 'DOWN'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                        : 'bg-rose-950/30 hover:bg-rose-900/40 border-rose-800/60 text-rose-400'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <TrendingDown className="w-6 h-6 mb-1 text-rose-400 group-hover:scale-110 transition" />
                    <span className="font-extrabold text-sm tracking-wide">BEAT DOWN</span>
                    <span className="text-xs font-mono font-semibold text-rose-300 mt-1">
                      {downMultiplier}x Payout
                    </span>
                    <span className="text-[10px] text-rose-500/90 mt-0.5">
                      Wins +${(stakeAmount * downMultiplier - stakeAmount).toFixed(1)}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Active Beat Tracker Card */}
            {activeBeat && (
              <div
                className={`p-3.5 rounded-xl border space-y-2 text-xs font-mono ${
                  activeBeatWinning
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 font-sans">
                    <Zap className="w-3.5 h-3.5" />
                    YOUR ACTIVE BEAT:
                  </span>
                  <span className="font-extrabold uppercase px-2 py-0.5 rounded bg-black/40">
                    {activeBeat.prediction} (${activeBeat.amount})
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300 text-[11px]">
                  <span>Potential Win:</span>
                  <span className="font-bold text-emerald-400">${activeBeat.potentialPayout}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                  <span>Current Status:</span>
                  <span className={activeBeatWinning ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {activeBeatWinning ? '🟢 IN THE MONEY' : '🔴 OUT OF MONEY'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Past Rounds History & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* History Table (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-200">Past 3-Minute Rounds History</h3>
            </div>
            <span className="text-xs text-slate-500">Auto-settled via Strike vs Close</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950/40 font-mono">
                  <th className="py-3 px-4">Round</th>
                  <th className="py-3 px-4">Strike Price</th>
                  <th className="py-3 px-4">Settlement</th>
                  <th className="py-3 px-4">Price Delta</th>
                  <th className="py-3 px-4 text-center">Winner</th>
                  <th className="py-3 px-4 text-right">Your Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {roundHistory.map((h, idx) => (
                  <tr key={`round-hist-${h.roundNumber}-${idx}`} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-300">
                      #{h.roundNumber}
                    </td>
                    <td className="py-3 px-4 text-amber-400">
                      ${h.strikePrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      ${h.settlementPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={h.diff >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {h.diff >= 0 ? '+' : ''}${h.diff.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          h.winner === 'UP'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {h.winner === 'UP' ? 'UP 🟢' : 'DOWN 🔴'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {h.userResult ? (
                        <div
                          className={`font-bold ${
                            h.userResult === 'WIN' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {h.userResult === 'WIN' ? `+$${h.userPnl?.toFixed(2)}` : `-$${Math.abs(h.userPnl || 0)}`}
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Stats Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Flame className="w-5 h-5 text-orange-400" />
              <h3 className="font-bold text-slate-100 text-sm">Your Beat Performance</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Total Played</span>
                <p className="text-xl font-mono font-bold text-slate-100">{totalRoundsPlayed}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Win Rate</span>
                <p className="text-xl font-mono font-bold text-blue-400">{winRate}%</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Total Wins</span>
                <p className="text-xl font-mono font-bold text-emerald-400">{totalWins}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Net Profit</span>
                <p className={`text-xl font-mono font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalProfit >= 0 ? `+$${totalProfit.toFixed(2)}` : `-$${Math.abs(totalProfit).toFixed(2)}`}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1 leading-relaxed">
              <span className="font-semibold text-slate-300 block">How 3-Minute Beats Work:</span>
              <p>
                Every 3 minutes, a new round opens with a fixed Strike Price. You predict if BTC will finish <strong>UP</strong> or <strong>DOWN</strong>. When the timer hits 00:00, the round holds to resolve the winner via spot settlement price!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Polymarket Live BTC Alerts Modal */}
      {showAlertsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-100">Polymarket Live BTC Price Alerts</h3>
                  <p className="text-xs text-slate-400">Timestamped events & minute countdown tracking</p>
                </div>
              </div>
              <button
                onClick={() => setShowAlertsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Set Custom Price Target Alert Section */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Set Custom BTC Price Alert</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">$</span>
                  <input
                    type="number"
                    placeholder={`e.g. ${(currentPrice + 50).toFixed(0)}`}
                    value={customTargetPrice}
                    onChange={(e) => setCustomTargetPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => {
                    const target = parseFloat(customTargetPrice);
                    if (!isNaN(target) && target > 0) {
                      setCustomTargetAlertSet(target);
                      const now = new Date();
                      const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
                      const alertItem: BtcPriceAlert = {
                        id: `alert_set_${Date.now()}`,
                        type: 'TARGET_REACHED',
                        title: `Target Alert Armed: $${target.toFixed(2)}`,
                        message: `System will chime and alert when BTC crosses $${target.toFixed(2)}`,
                        price: target,
                        timeStr,
                        minutesSeconds: `${formatTime(secondsRemaining)} remaining`,
                        direction: target >= currentPrice ? 'UP' : 'DOWN',
                        timestamp: Date.now()
                      };
                      setAlerts((a) => [alertItem, ...a]);
                      setLatestAlert(alertItem);
                      setCustomTargetPrice('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                >
                  Set Alert
                </button>
              </div>
              {customTargetAlertSet !== null && (
                <div className="flex items-center justify-between text-[11px] text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                  <span>Armed: Alert when BTC touches <strong>${customTargetAlertSet.toFixed(2)}</strong></span>
                  <button
                    onClick={() => setCustomTargetAlertSet(null)}
                    className="text-slate-400 hover:text-white text-[10px] underline ml-2"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Alerts Feed */}
            <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Recent Alert History ({alerts.length})
              </div>

              {alerts.map((al) => (
                <div
                  key={al.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                      <span>{al.direction === 'UP' ? '🟢' : al.direction === 'DOWN' ? '🔴' : 'ℹ️'}</span>
                      <span>{al.title}</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold font-mono">
                      ${al.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] font-sans">{al.message}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400">Time: <strong className="text-slate-200">{al.timeStr}</strong></span>
                    <span className="text-amber-300 font-semibold">{al.minutesSeconds}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <button
                onClick={() => {
                  const now = new Date();
                  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
                  const testAlert: BtcPriceAlert = {
                    id: `alert_test_${Date.now()}`,
                    type: 'STRIKE_CROSS',
                    title: '⚡ Polymarket Price Ping Test',
                    message: `Polymarket CLOB & Chainlink oracle confirmed price at $${currentPrice.toFixed(2)}`,
                    price: currentPrice,
                    timeStr,
                    minutesSeconds: `${formatTime(secondsRemaining)} remaining`,
                    direction: currentPrice >= strikePrice ? 'UP' : 'DOWN',
                    timestamp: Date.now()
                  };
                  setAlerts((a) => [testAlert, ...a]);
                  setLatestAlert(testAlert);
                  if (soundEnabled) sounds.playTick(1200);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                Send Test Price Alert
              </button>
              <button
                onClick={() => setShowAlertsModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
