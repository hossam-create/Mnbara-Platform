import React, { useState, useEffect, useCallback } from 'react';
import './AuctionTimer.css';

export interface AuctionTimerProps {
  endTime: string;
  onEnd?: () => void;
  autoExtend?: boolean;
  extendedEndTime?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'urgent' | 'ended';
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const AuctionTimer: React.FC<AuctionTimerProps> = ({
  endTime,
  onEnd,
  autoExtend = false,
  extendedEndTime,
  showLabels = true,
  size = 'md',
  variant = 'default',
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining(endTime));
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExtended, setIsExtended] = useState(false);

  function calculateTimeRemaining(end: string): TimeRemaining {
    const endDate = new Date(end).getTime();
    const now = new Date().getTime();
    const total = endDate - now;

    if (total <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((total % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(endTime);
      setTimeRemaining(remaining);

      // Set urgent mode when less than 1 hour remains
      if (remaining.total > 0 && remaining.total < 3600000) {
        setIsUrgent(true);
      } else {
        setIsUrgent(false);
      }

      // Check for auction end
      if (remaining.total <= 0) {
        clearInterval(timer);
        onEnd?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onEnd]);

  // Handle auto-extend
  useEffect(() => {
    if (autoExtend && extendedEndTime && timeRemaining.total > 0) {
      // Check if we should extend
      const shouldExtend = timeRemaining.total < 5 * 60 * 1000; // Less than 5 minutes
      
      if (shouldExtend && !isExtended) {
        setIsExtended(true);
        // The extended time should be set via props or parent
      }
    }
  }, [autoExtend, extendedEndTime, timeRemaining, isExtended]);

  const formatTime = (value: number, padding: number = 2): string => {
    return value.toString().padStart(padding, '0');
  };

  const timerClass = [
    'mnbara-auction-timer',
    `mnbara-auction-timer--${size}`,
    isUrgent && 'mnbara-auction-timer--urgent',
    timeRemaining.total <= 0 && 'mnbara-auction-timer--ended',
    isExtended && 'mnbara-auction-timer--extended',
    variant !== 'default' && `mnbara-auction-timer--${variant}`,
  ]
    .filter(Boolean)
    .join(' ');

  if (timeRemaining.total <= 0) {
    return (
      <div className={timerClass}>
        <div className="mnbara-auction-timer__ended">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <path d="M14.5 9.5L9.5 14.5M9.5 9.5l5 5" />
          </svg>
          <span>Auction Ended</span>
        </div>
      </div>
    );
  }

  return (
    <div className={timerClass}>
      {isExtended && (
        <div className="mnbara-auction-timer__extend-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Time Extended!
        </div>
      )}
      
      <div className="mnbara-auction-timer__units">
        {timeRemaining.days > 0 && (
          <div className="mnbara-auction-timer__unit">
            <div className="mnbara-auction-timer__value">{formatTime(timeRemaining.days)}</div>
            {showLabels && <div className="mnbara-auction-timer__label">Days</div>}
          </div>
        )}
        <div className="mnbara-auction-timer__unit">
          <div className="mnbara-auction-timer__value">{formatTime(timeRemaining.hours)}</div>
          {showLabels && <div className="mnbara-auction-timer__label">Hrs</div>}
        </div>
        <div className="mnbara-auction-timer__separator">:</div>
        <div className="mnbara-auction-timer__unit">
          <div className="mnbara-auction-timer__value">{formatTime(timeRemaining.minutes)}</div>
          {showLabels && <div className="mnbara-auction-timer__label">Min</div>}
        </div>
        <div className="mnbara-auction-timer__separator">:</div>
        <div className="mnbara-auction-timer__unit">
          <div className="mnbara-auction-timer__value">{formatTime(timeRemaining.seconds)}</div>
          {showLabels && <div className="mnbara-auction-timer__label">Sec</div>}
        </div>
      </div>
    </div>
  );
};

export default AuctionTimer;
