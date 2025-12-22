// ============================================
// ⏱️ AuctionTimer Component - Server-Synced Countdown
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { wsService } from '../../services/websocket';

interface AuctionTimerProps {
  endTime: string;
  status: string;
  auctionId?: string;
  onEnd?: () => void;
  onEndingSoon?: () => void;
  showWarning?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

// Warning threshold in milliseconds (2 minutes)
const WARNING_THRESHOLD = 2 * 60 * 1000;

export function AuctionTimer({
  endTime,
  status,
  auctionId,
  onEnd,
  onEndingSoon,
  showWarning = true,
  size = 'md',
}: AuctionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const endingSoonTriggered = useRef(false);
  const endTriggered = useRef(false);

  // Sync with server time via WebSocket
  useEffect(() => {
    if (!auctionId) return;

    const unsubscribe = wsService.subscribe('auction:time_sync', (data: unknown) => {
      const syncData = data as { serverTime: string; auctionId: string };
      if (syncData.auctionId === auctionId) {
        const serverTime = new Date(syncData.serverTime).getTime();
        const clientTime = Date.now();
        setServerTimeOffset(serverTime - clientTime);
      }
    });

    return () => unsubscribe();
  }, [auctionId]);

  // Handle ending soon WebSocket event
  useEffect(() => {
    if (!auctionId) return;

    const unsubscribe = wsService.subscribe('auction:ending_soon', (data: unknown) => {
      const eventData = data as { auctionId: string; secondsRemaining: number };
      if (eventData.auctionId === auctionId && !endingSoonTriggered.current) {
        endingSoonTriggered.current = true;
        setIsUrgent(true);
        onEndingSoon?.();
      }
    });

    return () => unsubscribe();
  }, [auctionId, onEndingSoon]);

  // Calculate time left
  const calculateTimeLeft = useCallback((): TimeLeft | null => {
    if (status === 'ended' || status === 'sold') {
      return null;
    }

    const end = new Date(endTime).getTime();
    const now = Date.now() + serverTimeOffset;
    const diff = end - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      total: diff,
    };
  }, [endTime, status, serverTimeOffset]);

  // Update timer every second
  useEffect(() => {
    const updateTimer = () => {
      const time = calculateTimeLeft();
      setTimeLeft(time);

      if (time === null) {
        setHasEnded(true);
        return;
      }

      // Check if ended
      if (time.total <= 0 && !endTriggered.current) {
        endTriggered.current = true;
        setHasEnded(true);
        onEnd?.();
        return;
      }

      // Check if ending soon (2 minutes warning)
      if (showWarning && time.total <= WARNING_THRESHOLD && time.total > 0) {
        if (!endingSoonTriggered.current) {
          endingSoonTriggered.current = true;
          setIsUrgent(true);
          onEndingSoon?.();
        }
      }

      // Set urgent state for visual feedback
      if (time.total <= WARNING_THRESHOLD) {
        setIsUrgent(true);
      } else if (time.days === 0 && time.hours < 1) {
        setIsUrgent(true);
      } else {
        setIsUrgent(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeLeft, onEnd, onEndingSoon, showWarning]);

  // Format time display
  const formatTimeDisplay = (): string => {
    if (hasEnded || timeLeft === null) {
      return 'Auction Ended';
    }

    if (timeLeft.total <= 0) {
      return 'Auction Ended';
    }

    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`;
    }

    if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
    }

    return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-sm py-2 px-3',
    md: 'text-base py-3 px-4',
    lg: 'text-lg py-4 px-6',
  };

  const containerClasses = `
    rounded-xl transition-all duration-300
    ${sizeClasses[size]}
    ${isUrgent 
      ? 'bg-red-50 border-2 border-red-200' 
      : 'bg-gray-50 border border-gray-200'
    }
    ${hasEnded ? 'bg-gray-100' : ''}
  `;

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!hasEnded && (
            <span className={`${isUrgent ? 'text-red-500' : 'text-gray-500'}`}>
              {isUrgent ? '⚡' : '⏱️'}
            </span>
          )}
          <span className="text-sm text-gray-600">
            {hasEnded ? 'Status' : 'Time Remaining'}
          </span>
        </div>
        <span className={`font-bold ${
          hasEnded 
            ? 'text-gray-600' 
            : isUrgent 
              ? 'text-red-600 animate-pulse' 
              : 'text-gray-900'
        }`}>
          {formatTimeDisplay()}
        </span>
      </div>

      {/* Countdown blocks for larger sizes */}
      {size === 'lg' && timeLeft && !hasEnded && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          <TimeBlock value={timeLeft.days} label="Days" isUrgent={isUrgent} />
          <TimeBlock value={timeLeft.hours} label="Hours" isUrgent={isUrgent} />
          <TimeBlock value={timeLeft.minutes} label="Mins" isUrgent={isUrgent} />
          <TimeBlock value={timeLeft.seconds} label="Secs" isUrgent={isUrgent} />
        </div>
      )}

      {/* Warning message */}
      {isUrgent && !hasEnded && showWarning && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
          <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Ending soon! Place your bid now!</span>
        </div>
      )}
    </div>
  );
}

// Time block sub-component
function TimeBlock({ value, label, isUrgent }: { value: number; label: string; isUrgent: boolean }) {
  return (
    <div className={`text-center p-2 rounded-lg ${isUrgent ? 'bg-red-100' : 'bg-white'}`}>
      <div className={`text-2xl font-bold ${isUrgent ? 'text-red-600' : 'text-gray-900'}`}>
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-xs text-gray-500 uppercase">{label}</div>
    </div>
  );
}

export default AuctionTimer;
