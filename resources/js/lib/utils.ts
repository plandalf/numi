import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatMoney(amount: number, currency?: string, locale: string = 'en-US'): string {
    // Convert cents to dollars/euros/etc.
    const value = amount / 100;

    try {
        const options: Intl.NumberFormatOptions = {
            style: currency ? 'currency' : 'decimal',
            currency: currency,
            minimumFractionDigits: 2,
        };

        if (currency) {
            options.currencyDisplay = 'narrowSymbol'; // Avoids prefixes like "US$" in some locales
        }

        return new Intl.NumberFormat(locale, options).format(value);
    } catch {
        const formatted = value.toFixed(2);
        return currency ? `${formatted} ${currency}` : formatted;
    }
}

export const slugify = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')        // Replace spaces with _
        .replace(/[^\w_-]+/g, '')   // Allow underscores and hyphens
        .replace(/[_-]+/g, '_')    // Replace multiple _ or - with single _
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
    try {
      const monthYear = format(date, 'MMM yyyy');
      return `${day}${suffix} ${monthYear}`;
    } catch {
      return '-';
    }
}

export function formatTimestamp(timestampString: string): string {
  const date = new Date(timestampString);
  const day = date.getDate();
  const suffix = getDaySuffix(day);
  try {
    const monthYear = format(date, 'MMM - hh:mm:ss');
    return `${day}${suffix} ${monthYear}`;
  } catch {
    return '-';
  }
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

export function isValidUrl(url: string): boolean {
    const urlPattern = new RegExp(
        '^(https?:\\/\\/)?' + // protocol (optional)
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR IP address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', // fragment locator
        'i' // case-insensitive
    );
    return urlPattern.test(url);
}

export function getSupportedCurrencies(): { code: string; name: string }[] {
    // Use ISO currency codes; UI can map symbols separately
    return [
        { code: 'USD', name: 'US Dollar' },
        { code: 'GBP', name: 'British Pound' },
        { code: 'JPY', name: 'Japanese Yen' },
        { code: 'CAD', name: 'Canadian Dollar' },
        { code: 'AUD', name: 'Australian Dollar' },
        { code: 'NZD', name: 'New Zealand Dollar' },
        { code: 'EUR', name: 'Euro' },
    ];
}
