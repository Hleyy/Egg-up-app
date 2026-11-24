import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en, type Messages } from '../i18n/en'
import { fr } from '../i18n/fr'
import { DEFAULT_DURATION_MINUTES, MAX_DURATION_MINUTES, MIN_DURATION_MINUTES } from '../game/rules'

export type Language = 'en' | 'fr'

export interface Settings {
  language: Language
  sound: boolean
  vibration: boolean
  defaultDurationMinutes: number
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  sound: true,
  vibration: true,
  defaultDurationMinutes: DEFAULT_DURATION_MINUTES,
}

const KEY = 'eggup:settings:v1'
const MESSAGES: Record<Language, Messages> = { en, fr }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]
export type MessageKey = Leaves<Messages>
export type TFunction = (key: MessageKey, vars?: Record<string, string | number>) => string

interface SettingsApi {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  reset: () => void
  t: TFunction
  buzz: (pattern?: number | number[]) => void
}

const SettingsContext = createContext<SettingsApi | null>(null)

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SETTINGS
    const s = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
    if (s.language !== 'en' && s.language !== 'fr') s.language = 'en'
    s.defaultDurationMinutes = Math.min(MAX_DURATION_MINUTES, Math.max(MIN_DURATION_MINUTES, Number(s.defaultDurationMinutes) || DEFAULT_DURATION_MINUTES))
    return s
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function translate(messages: Messages, key: string, vars?: Record<string, string | number>): string {
  const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages)
  const text = typeof value === 'string' ? value : key
  return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {
    }
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

export function useSettings(): SettingsApi {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
