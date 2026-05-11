import { useEffect, useState } from "react"

/**
 * A hook that delays the update of a value until after a specified delay has passed.
 * Useful for preventing expensive operations (like API calls or heavy filtering)
 * from running on every keystroke.
 * * @template T - The type of the value being debounced.
 * @param {T} value - The value to debounce (e.g., a search string).
 * @param {number} delay - The delay in milliseconds.
 * @returns {T} - The debounced value.
 * * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 300);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
