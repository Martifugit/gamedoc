import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const headingId = (sectionId: string, containerId: string) =>
  `h-${sectionId}-${containerId}`
export const sectionId = (s: string) => `s-${s}`
export const blockId = (id: string) => `b-${id}`

export function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Truncates a string to fit within `maxChars`, preferring to keep the start
 * and end of the string so the reader sees both the beginning and the suffix
 * (e.g. a number or keyword at the end). Falls back to a plain end-truncation
 * when the string is short enough that middle-truncation would look odd.
 *
 * @param str       The string to truncate.
 * @param maxChars  Maximum character length before truncating (default 40).
 * @param headRatio How much of maxChars goes to the leading portion (default 0.6).
 */
export function truncateMiddle(
  str: string,
  maxChars = 40,
  headRatio = 0.6
): string {
  if (str.length <= maxChars) return str
  const head = Math.floor(maxChars * headRatio)
  const tail = maxChars - head - 1 // –1 for the ellipsis character
  return `${str.slice(0, head)}…${str.slice(str.length - tail)}`
}

/**
 * Configuration options for the truncate utility.
 */
interface TruncateOptions {
  /** The maximum length of the resulting string, including the suffix. */
  length?: number
  /** The string to append to the end of the truncated text. Defaults to '...'. */
  suffix?: string
}

/**
 * Truncates a string to a specified length and appends a suffix.
 *
 * @param str - The input string to truncate.
 * @param options - Configuration for length and suffix.
 * @returns The truncated string, or the original string if it's within the limit.
 *
 * @example
 * truncate("Hello World", { length: 8 }); // "Hello..."
 * truncate("Hello World", { length: 20 }); // "Hello World"
 * truncate("Hello World", { length: 8, suffix: '!' }); // "Hello World!"
 */
export const truncate = (
  str: string,
  { length = 30, suffix = "..." }: TruncateOptions = {}
): string => {
  // If the string is already short enough, return it as is.
  if (str.length <= length) {
    return str
  }

  // Calculate the slice end point to account for the suffix length.
  // We use Math.max to ensure we don't end up with a negative index.
  const sliceIndex = Math.max(0, length - suffix.length)

  return `${str.slice(0, sliceIndex)}${suffix}`
}
