import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface SelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> {
    className?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <select
                className={cn(
                    'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    className
                )}
                ref={ref}
                {...props}
            >
                {children}
            </select>
        );
    }
);

Select.displayName = 'Select';

// Additional components for compatibility
const SelectTrigger = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <select
                className={cn(
                    'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    className
                )}
                ref={ref}
                {...props}
            >
                {children}
            </select>
        );
    }
);

SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
    ({ className, children, placeholder, ...props }, ref) => {
        return (
            <option
                className={cn('text-gray-500', className)}
                ref={ref}
                value=""
                disabled
                {...props}
            >
                {placeholder || children}
            </option>
        );
    }
);

SelectValue.displayName = 'SelectValue';

const SelectContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <div ref={ref} {...props}>
                {children}
            </div>
        );
    }
);

SelectContent.displayName = 'SelectContent';

const SelectItem = forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <option
                className={cn('py-1 px-2', className)}
                ref={ref}
                {...props}
            >
                {children}
            </option>
        );
    }
);

SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };