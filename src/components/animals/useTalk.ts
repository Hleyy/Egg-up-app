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

export function useTalk() {
  const [talking, setTalking] = useState(false)
  const [viseme, setViseme] = useState(0)
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
  }, [])

  const animate = useCallback(
    (value: string, step: number, until: number) => {
      stopTimer()
      let pos = 0
      const started = performance.now()
      timer.current = window.setInterval(() => {
        const ch = value[pos]?.toLowerCase() ?? ''
        pos += 1
        setViseme(ch in LETTER_VISEME ? LETTER_VISEME[ch] : 0)
        if (performance.now() - started > until || (!audio.current && pos >= value.length)) stop()
      }, step)
    },
    [stop],
  )

  const say = useCallback(
    (value: string, src?: string) => {
      stop()
      setTalking(true)
      const mimic = () => animate(value, CHAR_MS, Math.min(6000, value.length * CHAR_MS))
      if (!src) return mimic()
      const voice = new Audio(src)
      audio.current = voice
      const fail = () => {
        if (audio.current !== voice) return
        stopAudio()
        mimic()
      }
      voice.onloadedmetadata = () => {
        const ms = voice.duration * 1000
        if (Number.isFinite(ms)) animate(value, Math.max(40, ms / Math.max(1, value.length)), ms + 400)
      }
      voice.onended = () => audio.current === voice && stop()
      voice.onerror = fail
      void voice.play().catch(fail)
    },
    [animate, stop],
  )

  useEffect(() => stop, [stop])

  return { talking, viseme, say, stop }
}
