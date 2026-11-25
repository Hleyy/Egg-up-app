import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, MESSAGES, SETTINGS_KEY, SettingsContext, loadSettings, translate, type Settings, type SettingsApi } from './useSettings'

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch {}
    document.documentElement.lang = settings.language
  }, [settings])

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), [])
  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), [])

  const api = useMemo<SettingsApi>(() => {
    const messages = MESSAGES[settings.language]
    return {
      settings,
      update,
      reset,
      t: (key, vars) => translate(messages, key, vars),
      buzz: (pattern = 15) => {
        if (settings.vibration && 'vibrate' in navigator) navigator.vibrate(pattern)
      },
    }
  }, [settings, update, reset])

  return <SettingsContext.Provider value={api}>{children}</SettingsContext.Provider>
}
