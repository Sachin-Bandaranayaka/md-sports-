'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'info' | 'success';
    size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, children, isLoading, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
        const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

        const variants = {
            primary: 'bg-primary hover:bg-primary-700 text-tertiary',
            secondary: 'bg-secondary hover:bg-gray-800 text-tertiary',
            outline: 'border border-primary text-primary hover:bg-primary hover:text-tertiary',
            ghost: 'bg-transparent hover:bg-primary-50 text-primary',
            link: 'bg-transparent underline-offset-4 hover:underline text-primary hover:bg-transparent',
            info: 'bg-blue-500 hover:bg-blue-600 text-white',
            success: 'bg-green-500 hover:bg-green-600 text-white',
        };

        const sizes = {
            sm: 'h-9 px-3 text-sm rounded-md',
            md: 'h-10 px-4 py-2 rounded-md',
            lg: 'h-12 px-6 py-3 rounded-lg text-lg',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    baseClasses,
                    variants[variant],
                    sizes[size],
                    isLoading && 'opacity-70',
                    className
                )}
                disabled={isLoading || disabled}
                {...props}
            >
                {isLoading ? (
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