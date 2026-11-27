import type { ReactNode } from 'react'
import { BackButton, Btn, Page, Stepper, Toggle, TopBar } from '../components/ui'
import { MAX_TIMER_MINUTES, MIN_TIMER_MINUTES } from '../game/rules'
import { type Language, useSettings } from '../settings/useSettings'

function Row({ title, detail, children }: { title: string; detail?: string; children: ReactNode }) {
  return (
    <div className="border-mist flex items-center justify-between gap-3 border-b-2 px-4 py-3.5 last:border-b-0">
      <div className="min-w-0">
        <div className="text-ink text-[16px]">{title}</div>
        {detail && <div className="text-sub text-[13px]">{detail}</div>}
      </div>
      {children}
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="kicker text-sub mb-2 px-1">{title}</h2>
      <div className="tile overflow-hidden">{children}</div>
    </section>
  )
}

const LANGS: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
]

export function SettingsScreen() {
  const { t, settings, update, reset } = useSettings()
  const minutes = (d: number) => update({ timerMinutes: Math.min(MAX_TIMER_MINUTES, Math.max(MIN_TIMER_MINUTES, settings.timerMinutes + d)) })

  return (
    <Page>
      <TopBar left={<BackButton />} />
      <h1 className="font-display text-ink mt-4 text-[28px] leading-none">{t('settings.title')}</h1>
      <Group title={t('settings.language')}>
        <div className="grid grid-cols-2 gap-2 p-3">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={settings.language === l.id}
              onClick={() => update({ language: l.id })}
              className={`font-display rounded-2xl py-3 text-[16px] transition-all ${settings.language === l.id ? 'text-blue bg-[#DDF4FF] shadow-[inset_0_0_0_2px_#84D8FF,0_3px_0_#84D8FF]' : 'text-sub bg-white shadow-[inset_0_0_0_2px_#e5e5e5,0_3px_0_#e5e5e5]'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="text-sub px-4 pb-3 text-[13px]">{t('settings.languageDetail')}</p>
      </Group>
      <Group title={t('settings.sound')}>
        <Row title={t('settings.sound')}>
          <Toggle label={t('settings.sound')} on={settings.sound} onChange={(sound) => update({ sound })} />
        </Row>
        <Row title={t('settings.voice')}>
          <Toggle label={t('settings.voice')} on={settings.voice} onChange={(voice) => update({ voice })} />
        </Row>
        <Row title={t('settings.vibration')}>
          <Toggle label={t('settings.vibration')} on={settings.vibration} onChange={(vibration) => update({ vibration })} />
        </Row>
      </Group>
      <Group title={t('settings.game')}>
        <Row title={t('settings.answerTimer')} detail={t('settings.answerTimerDetail')}>
          <Toggle label={t('settings.answerTimer')} on={settings.answerTimer} onChange={(answerTimer) => update({ answerTimer })} />
        </Row>
        <Row title={t('settings.keepAwake')}>
          <Toggle label={t('settings.keepAwake')} on={settings.keepAwake} onChange={(keepAwake) => update({ keepAwake })} />
        </Row>
        <Row title={t('settings.gameTimer')} detail={t('settings.gameTimerDetail')}>
          <Toggle label={t('settings.gameTimer')} on={settings.gameTimer} onChange={(gameTimer) => update({ gameTimer })} />
        </Row>
        {settings.gameTimer && (
          <Row title={t('settings.duration')}>
            <Stepper
              label={t('settings.duration')}
              value={t('common.minutes', { n: settings.timerMinutes })}
              onMinus={() => minutes(-5)}
              onPlus={() => minutes(5)}
            />
          </Row>
        )}
      </Group>
      <Btn color="white" size="sm" className="mt-6 mb-4 min-h-[48px] w-full" onClick={reset}>
        {t('settings.reset')}
      </Btn>
    </Page>
  )
}
