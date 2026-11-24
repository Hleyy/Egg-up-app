import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, ConfirmDialog, Screen, formatClock } from '../components/ui'
import { useGame } from '../game/GameProvider'
import { TEAM_IDS } from '../game/rules'
import { useSettings } from '../settings/SettingsProvider'

export function HistoryScreen() {
  const { records, clearRecords } = useGame()
  const { t, settings } = useSettings()
  const navigate = useNavigate()
  const [confirmClear, setConfirmClear] = useState(false)
  const date = new Intl.DateTimeFormat(settings.language === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <Screen title={t('history.title')} actions={<Button variant="ghost" onClick={() => navigate(-1)}>{t('common.back')}</Button>}>
      {records.length === 0 ? (
        <p className="flex-1 text-center text-ink-muted">{t('history.empty')}</p>
      ) : (
        <ul className="flex-1 space-y-2">
          {records.map((r) => (
            <li key={r.id}>
              <Card className="space-y-2" >
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>{date.format(r.endedAt)}</span>
                  <span>{t('history.played', { time: formatClock(r.playedMs) })}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TEAM_IDS.map((id) => (
                    <div key={id} className={`flex items-center justify-between rounded-ui px-3 py-2 ${r.winner === id ? 'bg-surface-muted font-bold' : ''}`}>
                      <span className="flex items-center gap-2 truncate">
                        <span className={`size-3 shrink-0 rounded-full ${id === 'red' ? 'bg-team-red' : 'bg-team-blue'}`} aria-hidden />
                        {r.teams[id].name}
                      </span>
                      <span className="tabular-nums">{r.teams[id].score}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm">{r.winner ? t('history.winner', { team: r.teams[r.winner].name }) : t('history.timeout')}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {records.length > 0 && <Button variant="ghost" onClick={() => setConfirmClear(true)}>{t('history.clear')}</Button>}
      <ConfirmDialog
        open={confirmClear}
        message={t('history.clearConfirm')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => { clearRecords(); setConfirmClear(false) }}
      />
    </Screen>
  )
}
