import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// This utility function helps to combine tailwind classes with clsx and tailwind-merge
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
} 