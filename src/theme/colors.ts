import type { Season, TeamId } from '../game/types'

export const SEASON_COLOR: Record<Season, { f: string; l: string; soft: string }> = {
  summer: { f: '#FFC800', l: '#E0A800', soft: '#FFF5D3' },
  autumn: { f: '#FF9600', l: '#E07F00', soft: '#FFEBD1' },
  winter: { f: '#1CB0F6', l: '#1899D6', soft: '#DDF4FF' },
  spring: { f: '#58CC02', l: '#58A700', soft: '#E3FFCF' },
}

export const TEAM_COLOR: Record<TeamId, { f: string; l: string; soft: string; ink: string }> = {
  red: { f: '#FF4B4B', l: '#D93636', soft: '#FFE3E0', ink: '#E03131' },
  blue: { f: '#00C5EA', l: '#0095C0', soft: '#D9F8FC', ink: '#0A92BC' },
}

export const EGG_COLOR: Record<TeamId, { c: string; d: string }> = {
  red: { c: '#FF4B4B', d: '#D93636' },
  blue: { c: '#1CB0F6', d: '#1899D6' },
}

export interface Palette {
  stroke: string
  pill: string
  pillLine: string
  ring: string
  ringIn: string
  ringFill: string
  bar: string
}

export const CARD_PALETTE: Record<TeamId, Palette> = {
  blue: {
    stroke: '#0095C0',
    pill: '#8DF6F8',
    pillLine: '#D6FBFD',
    ring: '#00C5EA',
    ringIn: '#00DEDF',
    ringFill: '#E0E1FC',
    bar: '#00C5EA',
  },
  red: {
    stroke: '#D93636',
    pill: '#FFA69C',
    pillLine: '#FFDCD8',
    ring: '#FF4B4B',
    ringIn: '#FF7262',
    ringFill: '#FDE3E7',
    bar: '#FF4B4B',
  },
}
