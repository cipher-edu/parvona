import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  icon,
  iconRight,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={[
            'w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500',
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
            'transition-all duration-150',
            error ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white',
            icon ? 'pl-10' : '',
            iconRight ? 'pr-10' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {iconRight}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = '', id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={[
          'w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500',
          'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
          'transition-all duration-150',
          error ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={[
          'w-full px-4 py-3 rounded-xl border text-sm text-slate-900 bg-white appearance-none cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500',
          'disabled:bg-slate-50 disabled:text-slate-500',
          'transition-all duration-150',
          error ? 'border-red-400' : 'border-slate-200',
          className,
        ].join(' ')}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
