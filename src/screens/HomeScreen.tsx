import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookIcon, ChevronIcon, ClockIcon, GearIcon, PlayIcon, QrIcon } from '../components/icons'
import { Btn, ConfirmDialog, Flags, IconBtn, Page, Scene, TopBar } from '../components/ui'
import { currentPlayer, pawnOf } from '../game/selectors'
import { seasonOf } from '../game/rules'
import { useGame } from '../game/useGame'
import { useSettings } from '../settings/useSettings'

export function HomeScreen() {
  const { t } = useSettings()
  const { game, clearGame } = useGame()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const inProgress = game && game.status !== 'finished' ? game : null
  const season = inProgress ? seasonOf(pawnOf(inProgress, currentPlayer(inProgress)).distance) : 'spring'

  const startNew = () => {
    if (inProgress) setConfirm(true)
    else navigate('/setup')
  }

  return (
    <Page>
      <Scene season={season} />
      <TopBar
        left={
          <div className="flex gap-2">
            <IconBtn label={t('home.settings')} onClick={() => navigate('/settings')}>
              <GearIcon />
            </IconBtn>
            <IconBtn label={t('share.open')} onClick={() => navigate('/share')}>
              <QrIcon />
            </IconBtn>
          </div>
        }
        right={<Flags />}
      />
      <div className="flex flex-1 flex-col justify-center pb-[4vh]">
        <h1 className="anim-pop relative mx-auto w-[86%] max-w-[380px]">
          <span className="logo-glow pointer-events-none absolute inset-[8%_4%] rounded-full" aria-hidden="true" />
          <img src="/brand/logo.svg" alt={t('app.name')} className="logo-float relative block w-full" />
        </h1>
        <div className="mt-[clamp(20px,5vh,44px)] flex flex-col gap-3">
          {inProgress && (
            <button
              type="button"
              onClick={() => navigate(inProgress.status === 'paused' ? '/pause' : '/game')}
              className="tile stagger flex items-center gap-4 px-4 py-4 text-left active:translate-y-1 active:shadow-[inset_0_0_0_2px_#e5e5e5]"
            >
              <span className="bg-green grid size-11 shrink-0 place-items-center rounded-full text-white shadow-[0_3px_0_#58A700] [&>svg]:size-5 [&>svg]:translate-x-[1px]">
                <PlayIcon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="kicker text-green block">{t('home.inProgress')}</span>
                <span className="text-ink block truncate text-[17px]">
                  {t('home.summary', { red: inProgress.teams.red.score, blue: inProgress.teams.blue.score, season: t(`season.${season}`) })}
                </span>
              </span>
              <ChevronIcon className="text-faint size-6" />
            </button>
          )}
          <Btn shine className="stagger" style={{ ['--i' as string]: 1 }} onClick={startNew}>
            {t('home.newGame')}
          </Btn>
          <div className="stagger grid grid-cols-2 gap-3" style={{ ['--i' as string]: 2 }}>
            <Btn color="white" size="sm" className="min-h-[48px]" onClick={() => navigate('/rules')}>
              <BookIcon />
              {t('home.howToPlay')}
            </Btn>
            <Btn color="white" size="sm" className="min-h-[48px]" onClick={() => navigate('/history')}>
              <ClockIcon />
              {t('home.history')}
            </Btn>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        message={t('home.replaceConfirm')}
        confirmLabel={t('home.newGame')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          clearGame()
          navigate('/setup')
        }}
      />
    </Page>
  )
}
