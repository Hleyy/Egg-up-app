import { useNavigate } from 'react-router-dom'
import { Button, Card, Screen } from '../components/ui'
import { LanguageToggle } from '../components/LanguageToggle'
import { GOAL_POINTS, POINTS_PER_CORRECT_ANSWER } from '../game/rules'
import { useSettings, type MessageKey } from '../settings/SettingsProvider'

const STEPS: MessageKey[] = ['rules.r1', 'rules.r2', 'rules.r3', 'rules.r4', 'rules.r5', 'rules.r6', 'rules.r7']

export function RulesScreen() {
  const { t } = useSettings()
  const navigate = useNavigate()
  return (
    <Screen
      title={t('rules.title')}
      actions={
        <>
          <LanguageToggle />
          <Button variant="ghost" onClick={() => navigate(-1)}>{t('common.back')}</Button>
        </>
      }
    >
      <ol className="space-y-2">
        {STEPS.map((key, i) => (
          <li key={key}>
            <Card className="flex gap-3">
              <span className="font-display font-bold text-ink-muted">{i + 1}</span>
              <span>{t(key, { points: POINTS_PER_CORRECT_ANSWER, goal: GOAL_POINTS })}</span>
            </Card>
          </li>
        ))}
      </ol>
    </Screen>
  )
}
