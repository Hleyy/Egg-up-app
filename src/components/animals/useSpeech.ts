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

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? []
  return (
    voices.find((v) => v.lang === 'en-GB' && /female|libby|sonia|serena|kate/i.test(v.name)) ??
    voices.find((v) => v.lang === 'en-GB') ??
    voices.find((v) => v.lang.startsWith('en')) ??
    null
  )
}

export function useSpeech(enabled: boolean) {
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
    window.speechSynthesis?.cancel()
    setTalking(false)
    setViseme(0)
  }, [])

  const animate = useCallback((until: number | null) => {
    stopTimer()
    const started = performance.now()
    timer.current = window.setInterval(() => {
      const ch = text.current[pos.current]?.toLowerCase() ?? ''
      pos.current += 1
      setViseme(ch in LETTER_VISEME ? LETTER_VISEME[ch] : 0)
      if (pos.current >= text.current.length || (until !== null && performance.now() - started > until)) {
        if (until !== null) {
          stopTimer()
          setTalking(false)
          setViseme(0)
        } else pos.current = Math.max(0, text.current.length - 1)
      }
    }, CHAR_MS)
  }, [])

  const say = useCallback(
    (value: string) => {
      stop()
      text.current = value
      pos.current = 0
      setTalking(true)
      const synth = window.speechSynthesis
      if (!enabled || !synth || typeof SpeechSynthesisUtterance === 'undefined') {
        animate(Math.min(6000, value.length * CHAR_MS))
        return
      }
      const u = new SpeechSynthesisUtterance(value)
      u.lang = 'en-GB'
      u.rate = 0.92
      u.pitch = 1.15
      const voice = pickVoice()
      if (voice) u.voice = voice
      u.onboundary = (e) => {
        pos.current = e.charIndex
      }
      u.onend = () => stop()
      u.onerror = () => stop()
      animate(null)
      synth.speak(u)
    },
    [enabled, stop, animate],
  )

  useEffect(() => stop, [stop])

  return { talking, viseme, say, stop }
}
