import { useEffect, useState } from "react"

export function useAuth(credentials: string | null) {
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!credentials) return

    const validateCredentials = async () => {
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          body: JSON.stringify({ password: credentials }),
          headers: { "Content-Type": "application/json" },
        })

        setAuthorized(res.ok)
      } catch (error) {
        console.error("Auth failed", error)
        return setAuthorized(false)
      }
    }

    validateCredentials()
  }, [credentials])

  return authorized
}
