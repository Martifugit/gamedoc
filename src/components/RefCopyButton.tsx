import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Hash } from "lucide-react"
import { formatReference } from "@/lib/reference-syntax"

export function RefCopyButton({
  sectionId,
  containerId,
  name,
}: {
  sectionId: string
  containerId: string
  name: string
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const timeoutHandle = setTimeout(() => setCopied(false), 1200)

    return () => clearTimeout(timeoutHandle)
  }, [copied])

  return (
    <Button
      variant="ghost"
      size="icon"
      title="Copy reference"
      onClick={() => {
        navigator.clipboard.writeText(
          formatReference({ type: "heading", sectionId, containerId, headingName: name || "Untitled" })
        )
        setCopied(true)
      }}
    >
      <Hash className={`h-4 w-4 ${copied ? "text-primary" : ""}`} />
    </Button>
  )
}
