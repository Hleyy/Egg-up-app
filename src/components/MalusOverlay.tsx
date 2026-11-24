import { useEffect, useRef, useState } from 'react'
import { findCard } from '../data/cards'
import { useGame } from '../game/GameProvider'
import { useSettings } from '../settings/SettingsProvider'

export function MalusOverlay() {
  const { game } = useGame()
  const { t, settings, buzz } = useSettings()
  const seq = game?.malusSeq ?? 0
  const seen = useRef(seq)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (seq > seen.current) {
      seen.current = seq
      setVisible(true)
      buzz([40, 60, 40])
      const id = window.setTimeout(() => setVisible(false), 2500)
      return () => window.clearTimeout(id)
    }
  }, [seq, buzz])

  if (!visible || !game?.lastMalus) return null
  const m = game.lastMalus
  const card = findCard(m.cardId)
  return (
    <div role="alert" onClick={() => setVisible(false)} className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-6">
      <div className="w-full max-w-sm space-y-2 rounded-ui bg-surface p-6 text-center">
        <p className="font-display text-2xl font-bold">{t('game.malusBy', { team: game.teams[m.by].name })}</p>
        <p className="text-ink-muted">{t('game.malusTarget', { team: game.teams[m.target].name })}</p>
        {card && <p>{card.question[settings.language]}</p>}
      </div>
    </div>
  )
}
