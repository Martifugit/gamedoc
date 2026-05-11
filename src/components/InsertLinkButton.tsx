import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Button } from "./ui/button"
import { ExternalLink } from "lucide-react"
import { Input } from "./ui/input"

export function InsertLinkButton({
  onInsert,
}: {
  onInsert: (s: string) => void
}) {
  const [label, setLabel] = useState("")
  const [url, setUrl] = useState("https://")
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
          <ExternalLink className="h-3 w-3" /> Link
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-72 space-y-2">
        <Input
          placeholder="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Input
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button
          size="sm"
          className="w-full"
          onClick={() => {
            onInsert(`[${label || url}](${url})`)
            setOpen(false)
            setLabel("")
            setUrl("https://")
          }}
        >
          Insert
        </Button>
      </PopoverContent>
    </Popover>
  )
}
