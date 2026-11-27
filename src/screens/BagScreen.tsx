import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { StarIcon } from '../components/icons'
import { BackButton, Btn, Page, Scene, TopBar } from '../components/ui'
import { findCard } from '../data/cards'
import { currentPlayer } from '../game/selectors'
import type { TeamId } from '../game/types'
import { useLabels } from '../game/useView'
import { CARD_PALETTE } from '../theme/colors'
import { useGame } from '../game/useGame'
import { useSettings } from '../settings/useSettings'

export function BagScreen() {
  const { team: param } = useParams()
  const { game, useKept: spend } = useGame()
  const { t, settings } = useSettings()
  const labels = useLabels()
  const navigate = useNavigate()
  if (!game || (param !== 'red' && param !== 'blue')) return <Navigate to="/" replace />
  const team: TeamId = param
  const kept = game.teams[team].kept
  const canUse = game.status === 'playing' && game.phase.kind === 'roll' && currentPlayer(game).team === team
  const p = CARD_PALETTE[team]

  return (
    <Page>
      <Scene />
      <TopBar left={<BackButton to="/game" />} />
      <h1 className="font-display text-ink mt-4 text-[28px] leading-none">{t('bag.title')}</h1>
      <p className="text-sub mt-2 text-[15px]">{t('bag.subtitle')}</p>
      <div className="kicker mt-5" style={{ color: p.stroke }}>
        {kept.length ? t('bag.teamBag', { team: labels.team(game, team) }) : t('bag.empty', { team: labels.team(game, team) })}
      </div>
      <ul className="mt-3 flex flex-col gap-3 pb-4">
        {kept.map((id, i) => {
          const card = findCard(id)
          if (!card) return null
          const usable = canUse && !card.effect?.shield
          const when = card.use === 'malus' ? t('bag.whenMalus') : card.use === 'now' ? t('bag.whenNow') : t('bag.whenTurn')
          return (
            <li key={`${id}-${i}`} className="tile flex items-center gap-3 p-3" style={{ animation: `rise-in .4s cubic-bezier(.3,1.5,.5,1) ${i * 70}ms both` }}>
              <span className="gloss bg-yellow grid size-12 shrink-0 place-items-center rounded-2xl shadow-[0_3px_0_#E0A800]">
                <StarIcon className="size-6 text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-display text-ink text-[17px] leading-tight">{card.title?.en ?? card.text.en}</div>
                <div className="text-sub mt-0.5 text-[13px] leading-snug">{card.text.en}</div>
                {settings.language === 'fr' && <div className="text-sub/80 mt-0.5 text-[12px] leading-snug italic">{card.text.fr}</div>}
                <div className="mt-1 text-[12px] font-bold text-[#C88A00]">{when}</div>
              </div>
              {usable && (
                <Btn
                  size="sm"
                  color="yellow"
                  onClick={() => {
                    spend(team, id)
                    navigate('/game')
                  }}
                >
                  {t('bag.use')}
                </Btn>
              )}
            </li>
          )
        })}
      </ul>
      <Btn color="white" className="mt-auto w-full" onClick={() => navigate('/game')}>
        {t('bag.back')}
      </Btn>
    </Page>
  )
}
