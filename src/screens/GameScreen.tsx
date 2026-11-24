import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, Card, Screen, Segmented, Stepper, formatClock } from '../components/ui'
import { Egg } from '../components/Egg'
import { LanguageToggle } from '../components/LanguageToggle'
import { MalusOverlay } from '../components/MalusOverlay'
import { cardsOfType } from '../data/cards'
import { squareTypeAt } from '../data/board'
import { useGame } from '../game/GameProvider'
import { CARD_BONUS_POINTS, GOAL_POINTS, POINTS_PER_CORRECT_ANSWER, TEAM_IDS, eggStageOf, lapOf, otherTeam, seasonOf, squareOf } from '../game/rules'
import type { GameState, TeamId } from '../game/types'
import { useSettings } from '../settings/SettingsProvider'

export function GameScreen() {
  const g = useGame()
  const { t } = useSettings()
  const navigate = useNavigate()
  const [malusOpen, setMalusOpen] = useState(false)
  const [bonusPick, setBonusPick] = useState<{ team: TeamId | null; value: number }>({ team: null, value: 0 })
  const [corrections, setCorrections] = useState(false)

  const finished = g.game?.status === 'finished'
  useEffect(() => {
    if (finished) navigate('/end', { replace: true })
  }, [finished, navigate])

  if (!g.game) return <Navigate to="/" replace />
  if (g.game.status === 'paused') return <Navigate to="/pause" replace />
  const game = g.game
  const active = game.turn.team
  const bonus = bonusPick.team === active ? bonusPick.value : 0
  const setBonus = (value: number) => setBonusPick({ team: active, value })

  return (
    <Screen
      actions={
        <div className="flex w-full items-center gap-2">
          <div className="flex-1">
            <div className="text-xs text-ink-muted">{t('game.timeLeft')}</div>
            <div className="font-display text-2xl font-bold tabular-nums" aria-live="off">{formatClock(g.remaining)}</div>
          </div>
          <LanguageToggle />
          <Button variant="secondary" className="px-3 py-2" onClick={() => { g.pause(); navigate('/pause') }}>
            {t('game.pause')}
          </Button>
        </div>
      }
    >
      <p className="text-center text-xs text-ink-muted">{t('game.goal', { n: GOAL_POINTS })}</p>

      <div className="grid grid-cols-2 gap-3">
        {TEAM_IDS.map((id) => (
          <TeamPanel key={id} game={game} id={id} active={id === active} corrections={corrections} onSelect={() => g.setTurn(id)} />
        ))}
      </div>
      <p className="text-center text-xs text-ink-muted">{t('game.tapToGiveTurn')}</p>

      <Card className="space-y-3 text-center">
        <p className="font-display text-lg font-bold">{t('game.turnOf', { team: game.teams[active].name })}</p>
        {game.turn.roll === null ? (
          <Button className="w-full py-6 text-lg" onClick={() => g.roll()}>🎲 {t('game.roll')}</Button>
        ) : (
          <div className="rounded-ui bg-surface-muted py-4 font-display text-3xl font-bold" aria-live="polite">
            {t('game.rolled', { n: game.turn.roll })}
            <DrawHint distance={game.teams[active].distance} />
          </div>
        )}
        <div className="space-y-1 text-left">
          <span className="text-xs text-ink-muted">{t('game.cardBonus')}</span>
          <Segmented<number>
            label={t('game.cardBonus')}
            value={bonus}
            onChange={setBonus}
            options={CARD_BONUS_POINTS.map((n) => ({ value: n, label: n === 0 ? t('game.noBonus') : `+${n}` }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => { g.answer(true, bonus ? { scoreDelta: bonus } : null); setBonus(0) }}>
            {t('game.correct', { n: POINTS_PER_CORRECT_ANSWER + bonus })}
          </Button>
          <Button variant="secondary" onClick={() => { g.answer(false); setBonus(0) }}>{t('game.wrong')}</Button>
        </div>
        <Button variant="secondary" className="w-full" onClick={() => { g.endTurn(); setBonus(0) }}>{t('game.endTurn')}</Button>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" onClick={() => setMalusOpen(true)}>{t('game.playMalus')}</Button>
        <Button variant="secondary" aria-pressed={corrections} onClick={() => setCorrections((c) => !c)}>{t('game.correction')}</Button>
        <Button variant="secondary" disabled={!g.canUndo} onClick={g.undo}>{t('game.undo')}</Button>
      </div>

      {malusOpen && <MalusSheet game={game} onClose={() => setMalusOpen(false)} />}
      <MalusOverlay />
    </Screen>
  )
}

function TeamPanel({ game, id, active, corrections, onSelect }: { game: GameState; id: TeamId; active: boolean; corrections: boolean; onSelect: () => void }) {
  const { t } = useSettings()
  const g = useGame()
  const team = game.teams[id]
  const season = seasonOf(team.distance)
  return (
    <div
      className={`rounded-ui border-2 bg-surface p-3 ${active ? (id === 'red' ? 'border-team-red' : 'border-team-blue') : 'border-transparent'}`}
      data-team={id}
      data-active={active}
    >
      <button type="button" onClick={onSelect} className="flex w-full flex-col items-center gap-1 text-center" aria-pressed={active}>
        <span className="font-semibold">{team.name}</span>
        <Egg stage={eggStageOf(team.score)} team={id} />
        <span className="font-display text-3xl font-bold tabular-nums">{team.score}</span>
        <span className="text-xs text-ink-muted">
          {t('game.square', { n: squareOf(team.distance) + 1 })} · {t(`season.${season}`)} · {t('game.lap', { n: lapOf(team.distance) })}
        </span>
        {game.skipNext.includes(id) && <span className="text-xs text-danger">{t('game.skipNext')}</span>}
      </button>
      {corrections && (
        <div className="mt-3 space-y-2 border-t border-line pt-3">
          <Stepper label={t('game.score')} onMinus={() => g.adjustScore(id, -1)} onPlus={() => g.adjustScore(id, 1)}>{team.score}</Stepper>
          <Stepper label={t('game.position')} onMinus={() => g.move(id, -1)} onPlus={() => g.move(id, 1)}>{squareOf(team.distance) + 1}</Stepper>
        </div>
      )}
    </div>
  )
}

function MalusSheet({ game, onClose }: { game: GameState; onClose: () => void }) {
  const { t, settings } = useSettings()
  const g = useGame()
  const [by, setBy] = useState<TeamId>(game.turn.team)
  const malus = cardsOfType('malus')
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md space-y-3 rounded-t-ui bg-surface p-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold">{t('game.playMalus')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {TEAM_IDS.map((id) => (
            <Button key={id} variant={by === id ? 'primary' : 'secondary'} onClick={() => setBy(id)}>{game.teams[id].name}</Button>
          ))}
        </div>
        <p className="text-sm text-ink-muted">{t('game.malusTarget', { team: game.teams[otherTeam(by)].name })}</p>
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {malus.map((card) => (
            <li key={card.id}>
              <button
                type="button"
                className="w-full rounded-ui border border-line p-3 text-left"
                onClick={() => {
                  g.playMalus(by, card.id, card.effect ?? null)
                  onClose()
                }}
              >
                {card.question[settings.language]}
              </button>
            </li>
          ))}
        </ul>
        <Button variant="ghost" className="w-full" onClick={onClose}>{t('common.cancel')}</Button>
      </div>
    </div>
  )
}


function DrawHint({ distance }: { distance: number }) {
  const { t } = useSettings()
  const type = squareTypeAt(distance)
  return (
    <p className="mt-1 font-body text-base font-semibold" data-square-type={type}>
      {type === 'start' ? t('game.startSquare') : t('game.draw', { type: t(`cardType.${type}`) })}
    </p>
  )
}
