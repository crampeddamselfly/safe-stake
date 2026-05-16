import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Helper types used by shadcn-svelte primitives.
export type WithElementRef<T, Element = HTMLElement> = T & {
  ref?: Element | null
}

export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, "child"> : T
export type WithoutChildren<T> = T extends { children?: unknown }
  ? Omit<T, "children">
  : T
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>
