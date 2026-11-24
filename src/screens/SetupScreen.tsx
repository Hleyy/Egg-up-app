import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Screen, Segmented, Stepper } from '../components/ui'
import { useGame } from '../game/GameProvider'
import { MAX_DURATION_MINUTES, MIN_DURATION_MINUTES, TEAM_IDS } from '../game/rules'
import type { TeamId } from '../game/types'
import { useSettings } from '../settings/SettingsProvider'

type Starter = TeamId | 'random'

export function SetupScreen() {
  const { newGame } = useGame()
  const { t, settings } = useSettings()
  const navigate = useNavigate()
  const prefill = (useLocation().state as { teamNames?: Record<TeamId, string> } | null)?.teamNames

  const [names, setNames] = useState<Record<TeamId, string>>(prefill ?? { red: '', blue: '' })
  const [starter, setStarter] = useState<Starter>('random')
  const [minutes, setMinutes] = useState(settings.defaultDurationMinutes)

  const step = (d: number) => setMinutes((m) => Math.min(MAX_DURATION_MINUTES, Math.max(MIN_DURATION_MINUTES, m + d)))

  const start = () => {
    const firstTeam: TeamId = starter === 'random' ? (Math.random() < 0.5 ? 'red' : 'blue') : starter
    newGame({
      teamNames: { red: names.red.trim() || t('team.red'), blue: names.blue.trim() || t('team.blue') },
      firstTeam,
      durationMinutes: minutes,
    })
    navigate('/game', { replace: true })
  }

  return (
    <Screen title={t('setup.title')} back="/">
      <Card className="space-y-3">
        <h2 className="font-semibold">{t('setup.teams')}</h2>
        {TEAM_IDS.map((id) => (
          <label key={id} className="flex items-center gap-3">
            <span className={`size-4 shrink-0 rounded-full ${id === 'red' ? 'bg-team-red' : 'bg-team-blue'}`} aria-hidden />
            <input
              value={names[id]}
              maxLength={20}
              placeholder={t(`team.${id}`)}
              aria-label={`${t('setup.teamName')} (${t(`team.${id}`)})`}
              onChange={(e) => setNames((n) => ({ ...n, [id]: e.target.value }))}
              className="w-full rounded-ui border border-line bg-surface px-3 py-2"
            />
          </label>
        ))}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">{t('setup.whoStarts')}</h2>
        <Segmented<Starter>
          label={t('setup.whoStarts')}
          value={starter}
          onChange={setStarter}
          options={[
            { value: 'red', label: names.red.trim() || t('team.red') },
            { value: 'random', label: t('setup.random') },
            { value: 'blue', label: names.blue.trim() || t('team.blue') },
          ]}
        />
      </Card>

      <Card>
        <Stepper label={t('setup.duration')} onMinus={() => step(-5)} onPlus={() => step(5)}>
          {t('common.minutes', { n: minutes })}
        </Stepper>
      </Card>

      <div className="flex-1" />
      <Button onClick={start}>{t('setup.start')}</Button>
    </Screen>
  )
}
