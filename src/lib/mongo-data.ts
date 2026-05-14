import type { GameDoc } from "./gamedoc-types"

export async function loadGameDoc(pw: string): Promise<GameDoc | null> {
  const res = await fetch("/api/game", {
    headers: { "x-app-password": pw },
  })
  const data = await res.json()
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error("Load failed:", res.status, err)
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }

  return data
}

export async function saveGameDoc(doc: GameDoc, pw: string): Promise<void> {
  const res = await fetch("/api/game", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-app-password": pw },
    body: JSON.stringify(doc),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error("Save failed:", res.status, err)
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
}
