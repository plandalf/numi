import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatMoney(amount: number, currency: string): string {
    // Convert cents to dollars/euros/etc.
    const value = amount / 100;
    return new Intl.NumberFormat(undefined, { // Use user's locale
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2, // Ensure two decimal places
    }).format(value);
}

export const slugify = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')        // Replace spaces with _
        .replace(/[^\w_\-]+/g, '')   // Allow underscores and hyphens
        .replace(/[\_\-]+/g, '_')    // Replace multiple _ or - with single _
        .replace(/^_+/, '')         // Trim _ from start
        .replace(/_+$/, '');        // Trim _ from end
};
  