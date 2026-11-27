import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BookIcon, GearIcon, PlayIcon, UndoIcon } from '../components/icons'
import { Btn, ConfirmDialog, Page, Scene, TopBar } from '../components/ui'
import { currentPlayer } from '../game/selectors'
import { useLabels, useTurn } from '../game/useView'
import { TeamCards } from './game/parts'
import { formatClock } from '../lib/format'
import { useGame } from '../game/useGame'
import { useSettings } from '../settings/useSettings'

export function PauseScreen() {
  const { game, resume, abandon, undo, canUndo, remaining } = useGame()
  const { t } = useSettings()
  const labels = useLabels()
  const turn = useTurn()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)

  if (!game || !turn) return <Navigate to="/" replace />
  if (game.status === 'finished') return <Navigate to="/end" replace />

  const player = currentPlayer(game)
  const name = game.mode === 'class' ? labels.team(game, player.team) : player.name
  const back = () => {
    resume()
    navigate('/game')
  }

  return (
    <Page>
      <Scene season={turn.season} />
      <TopBar />
      <div className="pointer-events-none mt-4 blur-[3px] saturate-50" aria-hidden="true">
        <TeamCards game={game} />
      </div>
      <div className="fixed inset-0 z-10 bg-[#22202A]/25" style={{ animation: 'fade-in .3s both' }} />
      <div className="anim-sheet fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[460px] rounded-t-[30px] bg-white px-4 pt-3 pb-[max(18px,env(safe-area-inset-bottom))]">
        <div className="bg-line mx-auto mb-4 h-1.5 w-12 rounded-full" />
        <h1 className="font-display text-ink text-center text-[28px]">{t('pause.title')}</h1>
        <p className="text-sub mt-1 text-center text-[14px]">
          {t('pause.detail', { n: game.round, name })}
          {remaining !== null && ` · ${formatClock(remaining)}`}
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <Btn shine onClick={back}>
            <PlayIcon />
            {t('pause.resume')}
          </Btn>
          <div className="grid grid-cols-2 gap-3">
            <Btn color="white" size="sm" className="min-h-[48px]" onClick={() => navigate('/rules')}>
              <BookIcon />
              {t('pause.rules')}
            </Btn>
            <Btn color="white" size="sm" className="min-h-[48px]" onClick={() => navigate('/settings')}>
              <GearIcon />
              {t('pause.settings')}
            </Btn>
          </div>
          <Btn color="white" size="sm" className="min-h-[48px]" onClick={() => navigate('/fix')}>
            {t('pause.fix')}
          </Btn>
          {canUndo && (
            <Btn color="white" size="sm" className="min-h-[48px]" onClick={undo}>
              <UndoIcon />
              {t('pause.undo')}
            </Btn>
          )}
          <button type="button" className="text-red mt-1 py-2 text-[15px]" onClick={() => setConfirm(true)}>
            {t('pause.end')}
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        message={t('pause.endConfirm')}
        confirmLabel={t('pause.end')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          abandon()
          navigate('/end', { replace: true })
        }}
      />
    </Page>
  )
}
