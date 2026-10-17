import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  withPulse?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  withPulse = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[44px]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[38px]',
    md: 'text-sm px-4 py-2.5 gap-2 min-h-[44px]',
    lg: 'text-base px-6 py-3 gap-2.5 min-h-[48px]',
  };

  const variantStyles = {
    primary:
      'bg-primary text-white hover:bg-primary-hover shadow-sm active:translate-y-0.5 focus-visible:ring-primary',
    secondary:
      'bg-primary-tint text-primary hover:bg-[#D2EFF1] active:translate-y-0.5 focus-visible:ring-primary',
    outline:
      'border border-border bg-surface text-text-primary hover:bg-surface-subtle active:translate-y-0.5 focus-visible:ring-primary',
    ghost:
      'text-text-primary hover:bg-surface-subtle active:bg-[#EAE8E0] focus-visible:ring-primary',
    accent:
      'bg-accent text-white hover:bg-accent-hover shadow-sm active:translate-y-0.5 focus-visible:ring-accent',
    danger:
      'bg-status-critical text-white hover:bg-[#C23838] shadow-sm active:translate-y-0.5 focus-visible:ring-status-critical',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className} ${
        withPulse ? 'relative overflow-visible' : ''
      }`}
      disabled={disabled || isLoading}
      {...props}
    >
      {withPulse && !disabled && !isLoading && (
        <span className="absolute -inset-1 rounded-xl bg-primary/20 animate-ripple pointer-events-none" />
      )}
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
