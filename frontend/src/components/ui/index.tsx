import React from 'react';
import { Loader2 } from 'lucide-react';

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type BtnSize    = 'sm' | 'md' | 'lg';

const btnVariants: Record<BtnVariant, string> = {
  primary:   'bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
  ghost:     'hover:bg-slate-100 text-slate-700',
  danger:    'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200',
  success:   'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200',
};
const btnSizes: Record<BtnSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
};

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  icon?: React.ReactNode;
}
export function Button({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...rest }: BtnProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all ${btnVariants[variant]} ${btnSizes[size]} ${(loading || disabled) ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      disabled={loading || disabled}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}
export function Input({ label, error, icon, className = '', ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition ${icon ? 'pl-10' : ''} ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`}
          {...rest}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export function Textarea({ label, error, className = '', ...rest }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition resize-none ${error ? 'border-red-400' : ''} ${className}`}
        {...rest}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
const badgeColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-sky-100 text-sky-700',
  purple:  'bg-purple-100 text-purple-700',
};
export function Badge({ variant = 'default', children, className = '' }: { variant?: BadgeVariant; children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColors[variant]} ${className}`}>{children}</span>;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>{children}</div>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'purple', trend }: {
  label: string; value: string | number; icon: React.ReactNode;
  color?: 'purple' | 'sky' | 'emerald' | 'amber'; trend?: string;
}) {
  const colors = {
    purple: 'bg-purple-50 text-purple-600',
    sky:    'bg-sky-50 text-sky-600',
    emerald:'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
  };
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {trend && <p className="text-xs text-emerald-600 mt-1">{trend}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      </div>
    </Card>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ src, name, size = 'md' }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (src) return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white`} />;
  return <div className={`${sizes[size]} rounded-full bg-purple-100 text-purple-700 font-semibold flex items-center justify-center ring-2 ring-white`}>{initials}</div>;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-purple-600 ${className}`} />;
}

// ─── Empty state ─────────────────────────────────────────────────────────────
export function Empty({ icon, title, description }: { icon?: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-slate-300 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-xs">{description}</p>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"><span className="text-xl">×</span></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}
export function Select({ label, error, options, className = '', ...rest }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <select className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition ${error ? 'border-red-400' : ''} ${className}`} {...rest}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
