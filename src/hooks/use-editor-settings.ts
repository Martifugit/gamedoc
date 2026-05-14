import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "editor_settings"

interface EditorSettings {
  autoSync: boolean
}

const defaultSettings: EditorSettings = {
  autoSync: false,
}

function loadSettings(): EditorSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings
  } catch {
    return defaultSettings
  }
}

function saveSettings(settings: EditorSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore storage errors
  }
}

export function useEditorSettings() {
  const [settings, setSettings] = useState<EditorSettings>(loadSettings)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const toggleAutoSync = useCallback(() => {
    setSettings((s) => ({ ...s, autoSync: !s.autoSync }))
  }, [])

  return {
    autoSync: settings.autoSync,
    toggleAutoSync,
  }
}
