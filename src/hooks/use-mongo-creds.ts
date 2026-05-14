import { useCallback, useState } from "react"

const APP_PW = "app_pw"

function read(): string | null {
  const pw = localStorage.getItem(APP_PW)
  if (!pw) return null
  return pw
}

export function useMongoCredentials() {
  const [credentials, setCredentialsState] = useState<string | null>(read)

  const saveCredentials = useCallback((pw: string) => {
    localStorage.setItem(APP_PW, pw)
    setCredentialsState(pw)
  }, [])

  const clearCredentials = useCallback(() => {
    localStorage.removeItem(APP_PW)
    setCredentialsState(null)
  }, [])

  return { credentials, saveCredentials, clearCredentials }
}
