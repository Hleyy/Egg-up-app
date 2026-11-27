import { createContext, useContext } from 'react'
import { en, type Messages } from '../i18n/en'
import { fr } from '../i18n/fr'
import type { Sound } from './sounds'
import { DEFAULT_TIMER_MINUTES, MAX_TIMER_MINUTES, MIN_TIMER_MINUTES } from '../game/rules'

export type Language = 'en' | 'fr'

export interface Settings {
  language: Language
  sound: boolean
  voice: boolean
  vibration: boolean
  answerTimer: boolean
  keepAwake: boolean
  gameTimer: boolean
  timerMinutes: number
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  sound: true,
  voice: true,
  vibration: true,
  answerTimer: true,
  keepAwake: true,
  gameTimer: false,
  timerMinutes: DEFAULT_TIMER_MINUTES,
}

export const SETTINGS_KEY = 'eggup:settings:v2'
export const MESSAGES: Record<Language, Messages> = { en, fr }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]
export type MessageKey = Leaves<Messages>
export type TFunction = (key: MessageKey, vars?: Record<string, string | number>) => string

export interface SettingsApi {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  reset: () => void
  t: TFunction
  buzz: (pattern?: number | number[]) => void
  play: (sound: Sound) => void
  voice: (line: string) => string | undefined
}

export const SettingsContext = createContext<SettingsApi | null>(null)

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const saved = JSON.parse(raw) as Partial<Record<keyof Settings, unknown>> | null
    const flag = (key: Exclude<keyof Settings, 'language' | 'timerMinutes'>) => (typeof saved?.[key] === 'boolean' ? saved[key] : DEFAULT_SETTINGS[key])
    return {
      language: saved?.language === 'fr' ? 'fr' : 'en',
      sound: flag('sound'),
      vibration: flag('vibration'),
      answerTimer: flag('answerTimer'),
      keepAwake: flag('keepAwake'),
      gameTimer: flag('gameTimer'),
      voice: flag('voice'),
      timerMinutes: Math.min(MAX_TIMER_MINUTES, Math.max(MIN_TIMER_MINUTES, Number(saved?.timerMinutes) || DEFAULT_TIMER_MINUTES)),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function translate(messages: Messages, key: string, vars?: Record<string, string | number>): string {
  const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages)
  const text = typeof value === 'string' ? value : key
  return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text
}

export function useSettings(): SettingsApi {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
