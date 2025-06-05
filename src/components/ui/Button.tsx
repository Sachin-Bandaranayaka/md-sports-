'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'info' | 'success' | 'destructive';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

// Button variants function for external use
export const buttonVariants = (props: { variant?: string; size?: string } = {}) => {
  const { variant = 'primary', size = 'md' } = props;
  
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-primary hover:bg-primary-700 text-tertiary',
    secondary: 'bg-secondary hover:bg-gray-800 text-tertiary',
    outline: 'border border-primary text-primary hover:bg-primary hover:text-tertiary',
    ghost: 'bg-transparent hover:bg-primary-50 text-primary',
    link: 'bg-transparent underline-offset-4 hover:underline text-primary hover:bg-transparent',
    info: 'bg-blue-500 hover:bg-blue-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    destructive: 'bg-red-500 hover:bg-red-600 text-white',
    default: 'bg-primary hover:bg-primary-700 text-tertiary',
  };
  
  const sizes = {
    sm: 'h-9 px-3 text-sm rounded-md',
    md: 'h-10 px-4 py-2 rounded-md',
    lg: 'h-12 px-6 py-3 rounded-lg text-lg',
    icon: 'h-10 w-10 rounded-full p-0',
    default: 'h-10 px-4 py-2 rounded-md',
  };
  
  const variantClass = variants[variant as keyof typeof variants] || variants.default;
  const sizeClass = sizes[size as keyof typeof sizes] || sizes.default;
  
  return cn(baseClasses, variantClass, sizeClass);
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, children, isLoading = false, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
        const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

        const variants = {
            primary: 'bg-primary hover:bg-primary-700 text-tertiary',
            secondary: 'bg-secondary hover:bg-gray-800 text-tertiary',
            outline: 'border border-primary text-primary hover:bg-primary hover:text-tertiary',
            ghost: 'bg-transparent hover:bg-primary-50 text-primary',
            link: 'bg-transparent underline-offset-4 hover:underline text-primary hover:bg-transparent',
            info: 'bg-blue-500 hover:bg-blue-600 text-white',
            success: 'bg-green-500 hover:bg-green-600 text-white',
            destructive: 'bg-red-500 hover:bg-red-600 text-white',
            default: 'bg-primary hover:bg-primary-700 text-tertiary',
        };

        const sizes = {
            sm: 'h-9 px-3 text-sm rounded-md',
            md: 'h-10 px-4 py-2 rounded-md',
            lg: 'h-12 px-6 py-3 rounded-lg text-lg',
            icon: 'h-10 w-10 rounded-full p-0',
            default: 'h-10 px-4 py-2 rounded-md',
        };

        // Ensure isLoading is a boolean
        const isLoadingState = Boolean(isLoading);

        // Safe access to variants and sizes with fallbacks
        const variantClass = variants[variant] || variants.default;
        const sizeClass = sizes[size] || sizes.default;

        return (
            <button
                ref={ref}
                className={cn(
                    baseClasses,
                    variantClass,
                    sizeClass,
                    isLoadingState && 'opacity-70',
                    className
                )}
                disabled={isLoadingState || disabled}
                {...props}
            >
                {isLoadingState ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {children}
                    </>
                ) : (
                    children
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };