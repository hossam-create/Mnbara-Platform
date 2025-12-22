/**
 * AuctionTimer - Countdown timer component for auctions
 * Requirements: 8.1, 8.2 - Server-synchronized countdown timer
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AuctionTimerProps {
  endTime: string;
  onEnd?: () => void;
  showWarning?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const AuctionTimer: React.FC<AuctionTimerProps> = ({
  endTime,
  onEnd,
  showWarning = true,
  size = 'medium',
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [hasEnded, setHasEnded] = useState(false);

  const calculateTimeLeft = useCallback((): TimeLeft => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
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
  }, [endTime]);

  useEffect(() => {
    const updateTimer = () => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0 && !hasEnded) {
        setHasEnded(true);
        onEnd?.();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeLeft, hasEnded, onEnd]);

  if (!timeLeft) return null;

  const isEnded = timeLeft.total <= 0;
  const isEndingSoon = timeLeft.total > 0 && timeLeft.total <= 2 * 60 * 1000; // 2 minutes
  const isWarning = showWarning && timeLeft.total > 0 && timeLeft.total <= 5 * 60 * 1000; // 5 minutes

  const formatNumber = (num: number): string => num.toString().padStart(2, '0');

  const getContainerStyle = () => {
    const baseStyle = [styles.container, styles[`container_${size}`]];
    if (isEnded) return [...baseStyle, styles.containerEnded];
    if (isEndingSoon) return [...baseStyle, styles.containerUrgent];
    if (isWarning) return [...baseStyle, styles.containerWarning];
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`text_${size}`]];
    if (isEnded) return [...baseStyle, styles.textEnded];
    if (isEndingSoon) return [...baseStyle, styles.textUrgent];
    if (isWarning) return [...baseStyle, styles.textWarning];
    return baseStyle;
  };

  if (isEnded) {
    return (
      <View style={getContainerStyle()}>
        <Text style={getTextStyle()}>Auction Ended</Text>
      </View>
    );
  }

  return (
    <View style={getContainerStyle()}>
      {timeLeft.days > 0 && (
        <>
          <View style={styles.timeBlock}>
            <Text style={getTextStyle()}>{timeLeft.days}</Text>
            <Text style={styles.label}>d</Text>
          </View>
          <Text style={styles.separator}>:</Text>
        </>
      )}
      <View style={styles.timeBlock}>
        <Text style={getTextStyle()}>{formatNumber(timeLeft.hours)}</Text>
        <Text style={styles.label}>h</Text>
      </View>
      <Text style={styles.separator}>:</Text>
      <View style={styles.timeBlock}>
        <Text style={getTextStyle()}>{formatNumber(timeLeft.minutes)}</Text>
        <Text style={styles.label}>m</Text>
      </View>
      <Text style={styles.separator}>:</Text>
      <View style={styles.timeBlock}>
        <Text style={getTextStyle()}>{formatNumber(timeLeft.seconds)}</Text>
        <Text style={styles.label}>s</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  container_small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  container_medium: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  container_large: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  containerWarning: {
    backgroundColor: '#FFF3E0',
  },
  containerUrgent: {
    backgroundColor: '#FFEBEE',
  },
  containerEnded: {
    backgroundColor: '#E0E0E0',
  },
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  text: {
    fontWeight: 'bold',
    color: '#000',
    fontVariant: ['tabular-nums'],
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 18,
  },
  text_large: {
    fontSize: 24,
  },
  textWarning: {
    color: '#FF9500',
  },
  textUrgent: {
    color: '#FF3B30',
  },
  textEnded: {
    color: '#8E8E93',
  },
  label: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 1,
  },
  separator: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8E8E93',
    marginHorizontal: 2,
  },
});

export default AuctionTimer;
