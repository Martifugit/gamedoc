import { HEADING_LEVELS, type HeadingLevel } from "@/lib/gamedoc-types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

export function HeadingSelect({
  onChange,
  value,
  onBlur,
}: {
  value: HeadingLevel
  onChange: (val: HeadingLevel) => void
  onBlur?: () => void
}) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v) as HeadingLevel)}
    >
      <SelectTrigger
        onBlur={onBlur}
        className="h-8 w-16 rounded-md bg-transparent!"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {HEADING_LEVELS.map((h) => (
          <SelectItem key={h.string} value={String(h.level)}>
            {h.string}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
