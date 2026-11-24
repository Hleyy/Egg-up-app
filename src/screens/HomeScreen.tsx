import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ConfirmDialog, Screen } from '../components/ui'
import { LanguageToggle } from '../components/LanguageToggle'
import { useGame } from '../game/GameProvider'
import { useSettings } from '../settings/SettingsProvider'

export function HomeScreen() {
  const { game, clearGame } = useGame()
  const { t } = useSettings()
  const navigate = useNavigate()
  const [confirmNew, setConfirmNew] = useState(false)
  const inProgress = game && game.status !== 'finished'

  return (
    <Screen actions={<LanguageToggle />}>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <div className="size-32 rounded-full bg-surface-muted" aria-hidden />
        <h1 className="font-display text-4xl font-bold">{t('app.name')}</h1>
        <p className="text-ink-muted">{t('app.tagline')}</p>
      </div>
      <div className="flex flex-col gap-2">
        {inProgress && (
          <Button onClick={() => navigate(game.status === 'paused' ? '/pause' : '/game')}>
            {t('home.resume')}
            <span className="block text-xs font-normal opacity-80">
              {t('home.resumeDetail', { red: game.teams.red.name, redScore: game.teams.red.score, blue: game.teams.blue.name, blueScore: game.teams.blue.score })}
            </span>
          </Button>
        )}
        <Button variant={inProgress ? 'secondary' : 'primary'} onClick={() => (inProgress ? setConfirmNew(true) : navigate('/setup'))}>
          {t('home.newGame')}
        </Button>
        <Button variant="ghost" onClick={() => navigate('/settings')}>{t('home.settings')}</Button>
      </div>
      <ConfirmDialog
        open={confirmNew}
        message={t('home.replaceConfirm')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirmNew(false)}
        onConfirm={() => {
          clearGame()
          navigate('/setup')
        }}
      />
    </Screen>
  )
}
