import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface LabelProps
    extends React.LabelHTMLAttributes<HTMLLabelElement> {
    className?: string;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <label
                className={cn(
                    'text-sm font-medium text-gray-700',
                    className
                )}
                ref={ref}
                {...props}
            >
                {children}
            </label>
        );
    }
);

Label.displayName = 'Label';

export { Label }; 