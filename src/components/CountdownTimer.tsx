import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  endTime: string;
  isLive?: boolean;
  onExpire?: () => void;
  compact?: boolean;
  showUrgentWarning?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endTime,
  isLive = true,
  onExpire,
  compact = false,
  showUrgentWarning = true,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(endTime).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, totalMs: difference });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  const isUrgent = isLive && timeLeft.totalMs > 0 && timeLeft.totalMs <= 60000; // <= 60 seconds
  const isAntiSnipingDanger = isLive && timeLeft.totalMs > 0 && timeLeft.totalMs <= 30000; // <= 30 seconds
  const hasEnded = timeLeft.totalMs <= 0;

  if (hasEnded) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
        <Clock className="w-3.5 h-3.5" />
        Auction Ended
      </span>
    );
  }

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-colors ${
          isUrgent
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
            : 'bg-zinc-900/80 text-zinc-200 border border-zinc-700/60'
        }`}
      >
        <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-400' : 'text-amber-400'}`} />
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {timeLeft.days > 0 && (
          <div className="flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 min-w-[56px]">
            <span className="text-xl font-mono font-bold text-white">{timeLeft.days}</span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Days</span>
          </div>
        )}
        <div className="flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 min-w-[56px]">
          <span className="text-xl font-mono font-bold text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Hours</span>
        </div>
        <span className="text-zinc-600 font-bold">:</span>
        <div
          className={`flex flex-col items-center justify-center rounded-lg px-3 py-2 min-w-[56px] border transition-colors ${
            isUrgent ? 'bg-rose-950/40 border-rose-600/50 text-rose-300' : 'bg-zinc-900 border-zinc-800 text-white'
          }`}
        >
          <span className="text-xl font-mono font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Mins</span>
        </div>
        <span className="text-zinc-600 font-bold">:</span>
        <div
          className={`flex flex-col items-center justify-center rounded-lg px-3 py-2 min-w-[56px] border transition-all ${
            isUrgent
              ? 'bg-rose-600/20 border-rose-500 text-rose-400 shadow-lg shadow-rose-950/50 animate-pulse'
              : 'bg-zinc-900 border-zinc-800 text-white'
          }`}
        >
          <span className="text-xl font-mono font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Secs</span>
        </div>
      </div>

      {showUrgentWarning && isAntiSnipingDanger && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>Anti-sniping active: Bids now add +30s to the clock!</span>
        </div>
      )}
    </div>
  );
};
