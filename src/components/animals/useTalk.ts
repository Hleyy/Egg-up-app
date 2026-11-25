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
  const pos = useRef(0)
  const text = useRef('')

  const stopTimer = () => {
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = null
  }

  const stop = useCallback(() => {
    stopTimer()
    setTalking(false)
    setViseme(0)
  }, [])

  const say = useCallback(
    (value: string) => {
      stopTimer()
      text.current = value
      pos.current = 0
      setTalking(true)
      const until = Math.min(6000, value.length * CHAR_MS)
      const started = performance.now()
      timer.current = window.setInterval(() => {
        const ch = text.current[pos.current]?.toLowerCase() ?? ''
        pos.current += 1
        setViseme(ch in LETTER_VISEME ? LETTER_VISEME[ch] : 0)
        if (pos.current >= text.current.length || performance.now() - started > until) stop()
      }, CHAR_MS)
    },
    [stop],
  )

  useEffect(() => stop, [stop])

  return { talking, viseme, say, stop }
}
