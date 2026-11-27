export type Sound = 'dice' | 'right' | 'wrong' | 'bonus' | 'malus' | 'crack' | 'hatch' | 'win'

const players = new Map<Sound, HTMLAudioElement>()

export function playSound(sound: Sound) {
  let audio = players.get(sound)
  if (!audio) {
    audio = new Audio(`/sounds/${sound}.mp3`)
    players.set(sound, audio)
  }
  audio.currentTime = 0
  void audio.play().catch(() => undefined)
}
