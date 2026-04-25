import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`${sizes[size]} rounded-full border-slate-200 border-t-purple-600 animate-spin ${className}`}
      role="status"
      aria-label="Yuklanmoqda"
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-slate-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
          <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 rounded-lg" />
        <div className="h-3 bg-slate-200 rounded-lg w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-50 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="w-8 h-8 bg-slate-200 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded-lg w-1/3" />
            <div className="h-3 bg-slate-200 rounded-lg w-1/4" />
          </div>
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
          <div className="h-6 w-16 bg-slate-200 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonNannyCard() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
        <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-slate-200 rounded-full" />
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
        </div>
        <div className="h-9 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 animate-pulse">
      <div className="w-11 h-11 bg-slate-200 rounded-2xl mb-4" />
      <div className="h-8 bg-slate-200 rounded-lg w-1/2 mb-2" />
      <div className="h-3 bg-slate-200 rounded-lg w-3/4" />
    </div>
  );
}
