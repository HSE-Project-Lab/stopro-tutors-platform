import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'app-badge',
        'inline-flex items-center font-medium rounded-full',
        {
          'badge-default': variant === 'default',
          'badge-success': variant === 'success',
          'badge-warning': variant === 'warning',
          'badge-danger': variant === 'danger',
          'badge-info': variant === 'info',
        },
        {
          'bg-slate-100 text-slate-700': variant === 'default',
          'bg-emerald-100 text-emerald-700': variant === 'success',
          'bg-amber-100 text-amber-700': variant === 'warning',
          'bg-red-100 text-red-700': variant === 'danger',
          'bg-blue-100 text-blue-700': variant === 'info',
        },
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-2.5 py-1 text-sm': size === 'md',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
