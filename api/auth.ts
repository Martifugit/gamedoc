import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { password } = req.body

    if (password === process.env.APP_PW) {
      return res.status(200).json({ success: true })
    }

    return res.status(401).json({ success: false, message: "Invalid password" })
  } catch (error) {
    console.error("Authorization request failed", error)
    return res.status(500).json({ success: false, message: "Internal error" })
  }
}
