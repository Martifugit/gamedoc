import { useCallback, useMemo, useState } from "react"

export function useLocalDraft<T>(value: T, onCommit: (value: T) => void) {
  const [local, setLocal] = useState(value)

  const commit = useCallback(
    (valueToCommit: T) => {
      onCommit(valueToCommit)
    },
    [onCommit]
  )

  return {
    value: local,
    commit,
    onChange: setLocal,
    onBlur: () => onCommit(local),
  }
}

/** `commit` **must** be called with the value returned by a
 * helper or another syncronously computed value,
 * not `draft.value` */
export function useLocalArrayDraft<T>(
  initialValue: T[],
  onCommit: (value: T[]) => void
) {
  const [local, setLocal] = useState<T[]>(initialValue)

  const commit = useCallback(
    (valueToCommit: T[]) => {
      onCommit(valueToCommit)
    },
    [onCommit]
  )

  const helpers = useMemo(
    () => ({
      update: (index: number, newValue: T) => {
        setLocal((prev) =>
          prev.map((item, i) => (i === index ? newValue : item))
        )
      },
      add: () => {
        const next = [...local, "" as unknown as T]
        setLocal(next)
        return next
      },
      remove: (index: number) => {
        const next = local.filter((_, i) => i !== index)
        setLocal(next)
        return next
      },
      insert: (index: number, newItem: T) => {
        const next = [
          ...local.slice(0, index + 1),
          newItem,
          ...local.slice(index + 1),
        ]
        setLocal(next)
        return next
      },
      setAll: (newList: T[]) => {
        setLocal(newList)
      },
    }),
    [local]
  )

  return {
    value: local,

    commit,
    ...helpers,
    onBlur: () => onCommit(local),
  }
}
