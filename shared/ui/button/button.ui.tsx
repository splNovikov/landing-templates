import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'relative overflow-hidden',
          // Hover effects: sliding overlay and scale
          'before:content-[""] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full',
          'before:bg-[var(--color-button-text)]/20 before:transition-[left] before:duration-500 before:ease-in-out',
          'hover:before:left-[100%] hover:scale-105',
          {
            'bg-primary text-white hover:bg-primary-hover active:bg-primary-active shadow-secondary-md hover:shadow-secondary-glow':
              variant === 'primary',
            'border border-primary text-primary hover:bg-primary-light': variant === 'outline',
            'text-primary hover:bg-primary-light': variant === 'ghost',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
