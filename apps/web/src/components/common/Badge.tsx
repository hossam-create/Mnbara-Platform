import React from 'react';

export type BadgeVariant =
  | 'traveler'
  | 'verified-seller'
  | 'escrow-protected'
  | 'fast-route'
  | 'top-rated'
  | 'available'
  | 'unavailable'
  | 'pending'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const BADGE_CONFIG: Record<BadgeVariant, { bg: string; text: string; dot: string; defaultLabel: string }> = {
  'traveler':          { bg: 'bg-[#e8f4ff]',   text: 'text-[#0056a8]', dot: 'bg-[#0071DC]', defaultLabel: 'Traveler' },
  'verified-seller':   { bg: 'bg-[#e8faf0]',   text: 'text-[#1a7a3e]', dot: 'bg-[#22c55e]', defaultLabel: 'Verified Seller' },
  'escrow-protected':  { bg: 'bg-[#fff7e6]',   text: 'text-[#9a5a00]', dot: 'bg-[#f59e0b]', defaultLabel: 'Escrow Protected' },
  'fast-route':        { bg: 'bg-[#f3e8ff]',   text: 'text-[#6d28d9]', dot: 'bg-[#7c3aed]', defaultLabel: 'Fast Route' },
  'top-rated':         { bg: 'bg-[#fef9c3]',   text: 'text-[#854d0e]', dot: 'bg-[#eab308]', defaultLabel: 'Top Rated' },
  'available':         { bg: 'bg-[#dcfce7]',   text: 'text-[#166534]', dot: 'bg-[#16a34a]', defaultLabel: 'Available' },
  'unavailable':       { bg: 'bg-[#f3f4f6]',   text: 'text-[#6b7280]', dot: 'bg-[#9ca3af]', defaultLabel: 'Unavailable' },
  'pending':           { bg: 'bg-[#fff7ed]',   text: 'text-[#9a3412]', dot: 'bg-[#ea580c]', defaultLabel: 'Pending' },
  'success':           { bg: 'bg-[#dcfce7]',   text: 'text-[#166534]', dot: 'bg-[#16a34a]', defaultLabel: 'Success' },
  'warning':           { bg: 'bg-[#fef3c7]',   text: 'text-[#92400e]', dot: 'bg-[#d97706]', defaultLabel: 'Warning' },
  'danger':            { bg: 'bg-[#fee2e2]',   text: 'text-[#991b1b]', dot: 'bg-[#dc2626]', defaultLabel: 'Danger' },
  'info':              { bg: 'bg-[#e0f2fe]',   text: 'text-[#075985]', dot: 'bg-[#0284c7]', defaultLabel: 'Info' },
};

const SIZE_CLASSES = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
};

const DOT_SIZES = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

/**
 * Unified Badge component — used across all 3 domains
 * (Marketplace, Traveler, Wallet) for consistent visual identity.
 */
export default function Badge({ variant, label, className = '', size = 'md', icon }: BadgeProps) {
  const config = BADGE_CONFIG[variant];
  const sizeClass = SIZE_CLASSES[size];
  const dotSize = DOT_SIZES[size];

  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full border border-transparent
        ${config.bg} ${config.text} ${sizeClass} ${className}
      `}
    >
      {icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : (
        <span className={`rounded-full flex-shrink-0 ${config.dot} ${dotSize}`} />
      )}
      {label ?? config.defaultLabel}
    </span>
  );
}
