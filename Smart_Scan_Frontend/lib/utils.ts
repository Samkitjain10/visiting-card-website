import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove +91 prefix and clean
  let cleaned = phone.trim().replace(/^\+91[\s-]?/i, '');
  cleaned = cleaned.replace(/[-\s]/g, '');
  return cleaned;
}

