import type { VercelRequest, VercelResponse } from "@vercel/node"
import { MongoClient } from "mongodb"

const uri = process.env.MONGO_URI
const pw = process.env.APP_PW

// Log env var presence at module load (cold start)
console.log("[boot] MONGO_URI present:", !!uri, "length:", uri?.length ?? 0)
console.log("[boot] APP_PW present:", !!pw, "length:", pw?.length ?? 0)

if (!uri) {
  console.error("[boot] MONGO_URI is missing — function will fail")
}

// Only construct the client if uri exists, so a missing env var gives a clear error
const client = uri ? new MongoClient(uri) : null

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const reqId = Math.random().toString(36).slice(2, 8)
  const log = (...args: unknown[]) => console.log(`[${reqId}]`, ...args)
  const logErr = (...args: unknown[]) => console.error(`[${reqId}]`, ...args)

  log("incoming", req.method, "url:", req.url)

  if (!client || !uri) {
    // TEMPORARY DEBUG — remove after debugging
    if (uri) {
      try {
        const u = new URL(uri)
        log("URI scheme:", u.protocol)
        log("URI host:", u.host)
        log("URI username:", u.username)
        log("URI password length:", u.password.length)
        log("URI password first char:", u.password[0])
        log("URI password last char:", u.password[u.password.length - 1])
        log("URI pathname:", u.pathname)
        log("URI search:", u.search)
      } catch (e) {
        log("URI parse failed:", e)
      }
    }

    logErr("MONGO_URI not configured")
    return res
      .status(500)
      .json({ error: "Server misconfigured: MONGO_URI missing" })
  }
  if (!pw) {
    logErr("APP_PW not configured")
    return res
      .status(500)
      .json({ error: "Server misconfigured: APP_PW missing" })
  }

  const userPassword = req.headers["x-app-password"]
  log("auth header present:", !!userPassword, "matches:", userPassword === pw)

  if (userPassword !== pw) {
    return res.status(401).json({ error: "Unauthorized: Incorrect Password" })
  }

  try {
    log("connecting to mongo...")
    await client.connect()
    log("connected")

    const db = client.db("gamedoc_db")
    const collection = db.collection("docs")

    if (req.method === "GET") {
      log("GET: finding doc")
      const doc = await collection.findOne({})
      log("GET: found doc?", !!doc, "hasId:", !!doc?._id)
      return res.status(200).json(doc)
    }

    if (req.method === "POST") {
      const body = req.body
      log(
        "POST: body type:",
        typeof body,
        "isObject:",
        body !== null && typeof body === "object",
        "keys:",
        body && typeof body === "object" ? Object.keys(body).length : "n/a"
      )

      if (!body || typeof body !== "object") {
        logErr("POST: body missing or not an object")
        return res.status(400).json({ error: "Invalid request body" })
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...newDoc } = body
      log("POST: stripped _id, replacing...")

      const result = await collection.replaceOne(
        {},
        { ...newDoc, updatedAt: Date.now() },
        { upsert: true }
      )
      log(
        "POST: replace result — matched:",
        result.matchedCount,
        "modified:",
        result.modifiedCount,
        "upsertedId:",
        result.upsertedId
      )
      return res.status(200).json({ message: "Saved successfully" })
    }

    log("unsupported method:", req.method)
    return res.status(405).json({ error: "Method not allowed" })
  } catch (error) {
    logErr("handler error:", error)
    // Log the full error including code/name, since Mongo errors carry those
    if (error && typeof error === "object") {
      logErr("error name:", (error as { name?: string }).name)
      logErr("error code:", (error as { code?: unknown }).code)
      logErr("error codeName:", (error as { codeName?: string }).codeName)
    }
    return res.status(500).json({
      error:
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : typeof error === "string"
            ? error
            : "Unknown error occurred",
    })
  }
}
