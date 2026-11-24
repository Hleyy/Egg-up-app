import { useNavigate } from 'react-router-dom'
import { Button, Card, Screen, Segmented, Stepper } from '../components/ui'
import { MAX_DURATION_MINUTES, MIN_DURATION_MINUTES } from '../game/rules'
import { useSettings, type Language } from '../settings/SettingsProvider'

export function SettingsScreen() {
  const { t, settings, update, reset } = useSettings()
  const navigate = useNavigate()
  const onOff = [
    { value: 'on', label: t('settings.on') },
    { value: 'off', label: t('settings.off') },
  ] as const
  const step = (d: number) =>
    update({ defaultDurationMinutes: Math.min(MAX_DURATION_MINUTES, Math.max(MIN_DURATION_MINUTES, settings.defaultDurationMinutes + d)) })

  return (
    <Screen title={t('settings.title')} actions={<Button variant="ghost" onClick={() => navigate(-1)}>{t('common.back')}</Button>}>
      <Card className="space-y-2">
        <h2 className="text-sm text-ink-muted">{t('settings.language')}</h2>
        <Segmented<Language> label={t('settings.language')} value={settings.language} onChange={(language) => update({ language })} options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }]} />
      </Card>
      <Card className="space-y-2">
        <h2 className="text-sm text-ink-muted">{t('settings.sound')}</h2>
        <Segmented<'on' | 'off'> label={t('settings.sound')} value={settings.sound ? 'on' : 'off'} onChange={(v) => update({ sound: v === 'on' })} options={[...onOff]} />
      </Card>
      <Card className="space-y-2">
        <h2 className="text-sm text-ink-muted">{t('settings.vibration')}</h2>
        <Segmented<'on' | 'off'> label={t('settings.vibration')} value={settings.vibration ? 'on' : 'off'} onChange={(v) => update({ vibration: v === 'on' })} options={[...onOff]} />
      </Card>
      <Card>
        <Stepper label={t('settings.defaultDuration')} onMinus={() => step(-5)} onPlus={() => step(5)}>
          {t('common.minutes', { n: settings.defaultDurationMinutes })}
        </Stepper>
      </Card>
      <div className="flex-1" />
      <Button variant="ghost" onClick={reset}>{t('settings.reset')}</Button>
    </Screen>
  )
}
