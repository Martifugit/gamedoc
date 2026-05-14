import type { GameDoc } from "./gamedoc-types"

export async function loadGameDoc(pw: string): Promise<GameDoc | null> {
  const response = await fetch("/api/game", {
    headers: { "x-app-password": pw },
  })
  const data = await response.json()
  if (!data) return null
  return data
}

export async function saveGameDoc(doc: GameDoc, pw: string): Promise<void> {
  await fetch("/api/game", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-app-password": pw },
    body: JSON.stringify(doc),
  })
}
