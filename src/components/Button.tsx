import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  type = 'button',
  disabled = false,
}: ButtonProps) {
  const baseStyles = 'font-heading font-bold transition-all duration-200 treasure-border relative overflow-hidden';

  const variants = {
    primary: 'bg-copper-orange hover:bg-sunset-red text-parchment-light',
    secondary: 'bg-lakes-blue hover:bg-lakes-light text-parchment-light',
    outline: 'bg-transparent hover:bg-parchment-mid text-ink-primary',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed hover:bg-copper-orange',
        className
      )}
    >
      {children}
    </button>
  );
}
