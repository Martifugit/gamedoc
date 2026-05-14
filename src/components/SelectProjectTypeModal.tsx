import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "./ui/field"
import { Button } from "./ui/button"
import { useState } from "react"

export function SelectProjectTypeModal({
  updateProjectType,
}: {
  updateProjectType: (isNew: boolean) => void
}) {
  // Fixed: was always setting true; now correctly tracks the radio selection.
  const [isNew, setIsNew] = useState(true)

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <h1 className="mb-2">Are you starting a new project?</h1>
      <RadioGroup
        defaultValue="new"
        onValueChange={(v) => setIsNew(v === "new")}
        className="max-w-sm"
      >
        <FieldLabel htmlFor="new-project">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>New Project</FieldTitle>
              <FieldDescription>Ahh, a fresh start.</FieldDescription>
            </FieldContent>
            <RadioGroupItem value="new" id="new-project" />
          </Field>
        </FieldLabel>

        <FieldLabel htmlFor="not-new-project">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Continue Existing</FieldTitle>
              <FieldDescription>Back on ze grrriiind.</FieldDescription>
            </FieldContent>
            {/* Fixed: was incorrectly calling setIsNew(true) */}
            <RadioGroupItem value="existing" id="not-new-project" />
          </Field>
        </FieldLabel>

        <Button
          onClick={() => updateProjectType(isNew)}
          variant="outline"
          size="lg"
        >
          Let&apos;s Go
        </Button>
      </RadioGroup>
    </div>
  )
}
