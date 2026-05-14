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
