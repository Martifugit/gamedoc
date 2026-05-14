import { useEffect, useState } from "react"

export function useAuth(credentials: string | null) {
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!credentials) return
    const validateCredentials = async () => {
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" },
        })

        if (res.ok) {
          return true
        }

        return false
      } catch (error) {
        console.error("Auth failed", error)
        return false
      }
    }

    validateCredentials().then((value) => {
      setAuthorized(value)
    })
  }, [credentials])

  return authorized
}
