import data from '../data/voices.json'
import type { AnimalId } from './types'

export type Speaker = AnimalId | 'narrator'

const SPEAKERS = new Map<string, Speaker>(
  Object.entries(data as Record<Speaker, string[]>).flatMap(([speaker, lines]) => lines.map((line) => [line, speaker as Speaker])),
)

export function speakerOf(line: string): Speaker | undefined {
  return SPEAKERS.get(line)
}

export function animalOf(line: string): AnimalId | undefined {
  const speaker = speakerOf(line)
  return speaker && speaker !== 'narrator' ? speaker : undefined
}

export function voiceUrl(line: string): string | undefined {
  const speaker = speakerOf(line)
  return speaker ? `/voices/${speaker}/${line}.mp3` : undefined
}
