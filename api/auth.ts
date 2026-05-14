// api/verify-password/route.ts
export async function POST(req: Request) {
  const { password } = await req.json()

  if (password === process.env.APP_PW) {
    return Response.json({ success: true })
  }

  return Response.json({ success: false }, { status: 401 })
}
