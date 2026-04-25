import React from 'react';

type BadgeVariant = 'purple' | 'green' | 'red' | 'yellow' | 'blue' | 'slate' | 'orange';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  purple: 'bg-purple-100 text-purple-700',
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue:   'bg-sky-100 text-sky-700',
  slate:  'bg-slate-100 text-slate-600',
  orange: 'bg-orange-100 text-orange-700',
};

const dotColors: Record<BadgeVariant, string> = {
  purple: 'bg-purple-500',
  green:  'bg-green-500',
  red:    'bg-red-500',
  yellow: 'bg-yellow-500',
  blue:   'bg-sky-500',
  slate:  'bg-slate-400',
  orange: 'bg-orange-500',
};

export function Badge({ variant = 'slate', size = 'sm', dot = false, children }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1',
        variants[variant],
      ].join(' ')}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

// Booking status badge
export const STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending:   'yellow',
  confirmed: 'blue',
  active:    'purple',
  completed: 'green',
  cancelled: 'red',
  disputed:  'orange',
  resolved:  'slate',
};

export const STATUS_LABEL: Record<string, string> = {
  pending:   'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  active:    'Faol',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
  disputed:  'Munozarali',
  resolved:  'Hal qilingan',
};
