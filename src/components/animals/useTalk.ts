import { useCallback, useEffect, useRef, useState } from 'react'

const LETTER_VISEME: Record<string, number> = {
  a: 1,
  e: 2,
  i: 3,
  y: 3,
  o: 5,
  u: 6,
  w: 6,
  m: 0,
  b: 0,
  p: 0,
  f: 8,
  v: 8,
  l: 4,
  n: 4,
  t: 4,
  d: 4,
  s: 7,
  z: 7,
  c: 7,
  r: 9,
  g: 2,
  k: 2,
  h: 1,
  j: 7,
  q: 6,
  x: 7,
}

const CHAR_MS = 62
const VOICE_MS = 50

export function useTalk() {
  const [talking, setTalking] = useState(false)
  const [viseme, setViseme] = useState(0)
  const [time, setTime] = useState<number | null>(null)
  const timer = useRef<number | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)

  const stopTimer = () => {
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = null
  }

  const stopAudio = () => {
    const current = audio.current
    audio.current = null
    if (!current) return
    current.onloadedmetadata = current.onended = current.onerror = null
    current.pause()
  }

  const stop = useCallback(() => {
    stopTimer()
    stopAudio()
    setTalking(false)
    setViseme(0)
    setTime(null)
  }, [])

  const animate = useCallback(
    (value: string, step: number, until: number) => {
      stopTimer()
      let pos = 0
      const started = performance.now()
      timer.current = window.setInterval(() => {
        const voice = audio.current
        if (voice?.duration) {
          pos = Math.floor((voice.currentTime / voice.duration) * value.length)
          setTime(voice.currentTime * 1000)
        }
        const ch = value[pos]?.toLowerCase() ?? ''
        pos += 1
        setViseme(ch in LETTER_VISEME ? LETTER_VISEME[ch] : 0)
        if (performance.now() - started > until || (!audio.current && pos >= value.length)) stop()
      }, step)
    },
    [stop],
  )

  const say = useCallback(
    (value: string, src?: string, rate = 1) => {
      stop()
      setTalking(true)
      const mimic = () => animate(value, CHAR_MS, Math.min(6000, value.length * CHAR_MS))
      if (!src) return mimic()
      const voice = new Audio(src)
      voice.playbackRate = rate
      audio.current = voice
      const fail = () => {
        if (audio.current !== voice) return
        stopAudio()
        mimic()
      }
      voice.onloadedmetadata = () => {
        const ms = (voice.duration * 1000) / rate
        if (Number.isFinite(ms)) animate(value, VOICE_MS, ms + 400)
      }
      voice.onended = () => audio.current === voice && stop()
      voice.onerror = fail
      void voice.play().catch(fail)
    },
    [animate, stop],
  )

  useEffect(() => stop, [stop])

  return { talking, viseme, time, say, stop }
}
