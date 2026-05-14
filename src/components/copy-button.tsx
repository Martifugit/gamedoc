import { useClipboard, type ClipboardItem } from "@/context/use-clipboard"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Copy, CopyCheck } from "lucide-react"

export function CopyButton({
  item,
  className,
}: {
  item: ClipboardItem
  className?: string
}) {
  const { copy } = useClipboard()
  const [justCopied, setJustCopied] = useState(false)

  useEffect(() => {
    if (!justCopied) return

    const timeoutHandle = setTimeout(() => {
      setJustCopied(false)
    }, 600)

    return () => clearTimeout(timeoutHandle)
  }, [justCopied])

  return (
    <Button
      className={className}
      size="icon"
      variant="ghost"
      onClick={() => {
        copy(item)
        setJustCopied(true)
      }}
      title="Copy block"
    >
      {justCopied ? (
        <CopyCheck className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  )
}
