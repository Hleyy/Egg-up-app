import { Navigate, useNavigate } from 'react-router-dom'
import { Button, Screen } from '../components/ui'
import { Egg } from '../components/Egg'
import { useGame } from '../game/GameProvider'
import { TEAM_IDS, eggStageOf } from '../game/rules'
import { useSettings } from '../settings/SettingsProvider'

export function EndScreen() {
  const { game, clearGame } = useGame()
  const { t } = useSettings()
  const navigate = useNavigate()
  if (!game) return <Navigate to="/" replace />
  if (game.status !== 'finished') return <Navigate to="/game" replace />

  const title =
    game.endReason === 'hatched' && game.winner ? t('end.winner', { team: game.teams[game.winner].name })
    : game.endReason === 'timeout' ? t('end.timeout')
    : t('end.abandoned')
  const detail = game.endReason === 'hatched' ? t('end.hatchedDetail') : game.endReason === 'timeout' ? t('end.timeoutDetail') : t('end.abandonedDetail')
  const teamNames = { red: game.teams.red.name, blue: game.teams.blue.name }

  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center" data-end-reason={game.endReason}>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="text-ink-muted">{detail}</p>
        <div className="flex gap-8">
          {TEAM_IDS.map((id) => (
            <div key={id} className="flex flex-col items-center gap-1">
              <Egg stage={eggStageOf(game.teams[id].score, game.winner === id)} team={id} size={72} />
              <span className="font-semibold">{game.teams[id].name}</span>
              <span className="tabular-nums">{t('common.points', { n: game.teams[id].score })}</span>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={() => { clearGame(); navigate('/setup', { replace: true, state: { teamNames } }) }}>{t('end.playAgain')}</Button>
      <Button variant="secondary" onClick={() => { clearGame(); navigate('/', { replace: true }) }}>{t('end.home')}</Button>
    </Screen>
  )
}
