import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for conditionally joining and merging Tailwind class names */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
