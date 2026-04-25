import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddings = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

export function Card({ children, className = '', padding = 'md', hover = false }: CardProps) {
  return (
    <div
      className={[
        'bg-white rounded-3xl border border-slate-100 shadow-sm',
        paddings[padding],
        hover ? 'hover:border-purple-200 hover:shadow-md transition-all duration-200 cursor-pointer' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: 'purple' | 'green' | 'blue' | 'orange';
}

const statColors = {
  purple: { icon: 'bg-purple-100 text-purple-600', trend: 'text-purple-600' },
  green:  { icon: 'bg-green-100 text-green-600',   trend: 'text-green-600'  },
  blue:   { icon: 'bg-sky-100 text-sky-600',        trend: 'text-sky-600'   },
  orange: { icon: 'bg-orange-100 text-orange-600',  trend: 'text-orange-600'},
};

export function StatCard({ label, value, icon, trend, color = 'purple' }: StatCardProps) {
  const c = statColors[color];
  return (
    <Card padding="md">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold ${trend.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
    </Card>
  );
}
