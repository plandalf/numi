import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

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


export function pluralize(word: string, count: number): string {
    return count === 1 ? word : `${word}s`;
}

/**
 * Formats a date string to display as "2nd Jan 2025"
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate();
    const suffix = getDaySuffix(day);
    const monthYear = format(date, 'MMM yyyy');
    return `${day}${suffix} ${monthYear}`;
}

/**
 * Returns the appropriate ordinal suffix for a day number
 * @param day - The day of the month
 * @returns The ordinal suffix (st, nd, rd, th)
 */
export function getDaySuffix(day: number): string {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}