import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, ConfirmDialog, Screen, formatClock } from '../components/ui'
import { useGame } from '../game/GameProvider'
import { useSettings } from '../settings/SettingsProvider'

export function PauseScreen() {
  const g = useGame()
  const { t } = useSettings()
  const navigate = useNavigate()
  const [confirmQuit, setConfirmQuit] = useState(false)
  const status = g.game?.status

  useEffect(() => {
    if (status === 'playing') g.pause()
  }, [status, g])

  if (!g.game) return <Navigate to="/" replace />
  if (status === 'finished') return <Navigate to="/end" replace />
  const game = g.game

  const restart = () => {
    const first = game.log.find((e) => e.kind === 'start')
    g.newGame({
      teamNames: { red: game.teams.red.name, blue: game.teams.blue.name },
      firstTeam: first?.kind === 'start' ? first.team : 'red',
      durationMinutes: Math.round(game.timer.durationMs / 60_000),
    })
    navigate('/game', { replace: true })
  }

  return (
    <Screen title={t('pause.title')}>
      <p className="text-center font-display text-4xl font-bold tabular-nums">{formatClock(g.remaining)}</p>
      <div className="flex flex-1 flex-col justify-center gap-2">
        <Button onClick={() => { g.resume(); navigate('/game', { replace: true }) }}>{t('pause.resume')}</Button>
        <Button variant="secondary" onClick={() => navigate('/settings')}>{t('pause.settings')}</Button>
        <Button variant="secondary" onClick={restart}>{t('pause.restart')}</Button>
        <Button variant="danger" onClick={() => setConfirmQuit(true)}>{t('pause.quit')}</Button>
      </div>
      <ConfirmDialog
        open={confirmQuit}
        message={t('pause.quitConfirm')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirmQuit(false)}
        onConfirm={() => { g.clearGame(); navigate('/', { replace: true }) }}
      />
    </Screen>
  )
}
