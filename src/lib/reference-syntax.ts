// lib/reference-syntax.ts
import { sectionId, headingId } from "./utils"

export type ReferenceTarget =
  | { type: "section"; sectionId: string; sectionName: string }
  | {
      type: "heading"
      sectionId: string
      containerId: string
      headingName: string
    }

export function formatReference(
  target: ReferenceTarget,
  customLabel?: string
): string {
  switch (target.type) {
    case "section": {
      return customLabel
        ? `[[ref:${target.sectionId}:${target.sectionName}|${customLabel}]]`
        : `[[ref:${target.sectionId}:${target.sectionName}]]`
    }
    case "heading": {
      const compositeId = `${target.sectionId}/${target.containerId}`
      return customLabel
        ? `[[ref:${compositeId}:${target.headingName}|${customLabel}]]`
        : `[[ref:${compositeId}:${target.headingName}]]`
    }
  }
}

/** Produces the canonical `{{var:id:name}}` syntax. */
export function formatVariableReference(id: string, name: string): string {
  return `{{var:${id}:${name}}}`
}

/** Parses `{{var:id:name}}` → `{ id, name }`, or null if the text doesn't match. */
export function parseVariableReference(
  text: string
): { id: string; name: string } | null {
  const match = text.match(/^\{\{var:([^}:]+):([^}]*)\}\}$/)
  if (!match) return null
  return { id: match[1], name: match[2] }
}

export function parseReference(
  refText: string
): { targetId: string; name: string; customLabel?: string } | null {
  // Match [[ref:targetId:name]] or [[ref:targetId:name|customLabel]]
  const match = refText.match(/^\[\[ref:([^:]+):([^\]|]+)(?:\|([^\]]+))?\]\]$/)
  if (!match) return null

  return {
    targetId: match[1],
    name: match[2],
    customLabel: match[3],
  }
}

export function getReferenceHash(targetId: string): string {
  // Check if it's a composite ID (contains /)
  if (targetId.includes("/")) {
    const [sectionIdParam, containerIdParam] = targetId.split("/")
    return `#${headingId(sectionIdParam, containerIdParam)}`
  } else {
    return `#${sectionId(targetId)}`
  }
}

export function buildHeadingsMap(doc: {
  sections: Array<{
    id: string
    title: string
    containers: Array<{ id: string; title: string }>
  }>
}): Map<string, string> {
  const map = new Map<string, string>()

  doc.sections.forEach((section) => {
    // Section reference
    map.set(section.id, section.title)

    // Heading references (composite ID)
    section.containers.forEach((container) => {
      const compositeId = `${section.id}/${container.id}`
      map.set(compositeId, container.title)
    })
  })

  return map
}
