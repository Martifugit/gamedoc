// api/game.ts
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { MongoClient } from "mongodb"

const uri = process.env.MONGO_URI!
const pw = process.env.APP_PW
const client = new MongoClient(uri)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userPassword = req.headers["x-app-password"]

  // process.env.APP_PASSWORD
  if (userPassword !== pw) {
    return res.status(401).json({ error: "Unauthorized: Incorrect Password" })
  }

  try {
    await client.connect()
    const db = client.db("gamedoc_db")
    const collection = db.collection("docs")

    if (req.method === "GET") {
      const doc = await collection.findOne({})
      return res.status(200).json(doc)
    }

    if (req.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...newDoc } = req.body
      await collection.replaceOne(
        {},
        { ...newDoc, updatedAt: Date.now() },
        { upsert: true }
      )
      return res.status(200).json({ message: "Saved successfully" })
    }
  } catch (error) {
    return res.status(500).json({
      error:
        error && typeof error === "object" && "message" in error
          ? error.message
          : typeof error === "string"
            ? error
            : "Unknown error occured while",
    })
  }
}
