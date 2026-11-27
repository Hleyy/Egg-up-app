import { Navigate } from 'react-router-dom'
import { Avatar, BackButton, Page, Stepper, TopBar } from '../components/ui'
import { squareOf, TEAM_IDS } from '../game/rules'
import { useLabels } from '../game/useView'
import { CARD_PALETTE } from '../theme/colors'
import { useGame } from '../game/useGame'
import { useSettings } from '../settings/useSettings'

export function FixScreen() {
  const { game, adjustScore, movePawn } = useGame()
  const { t } = useSettings()
  const labels = useLabels()
  if (!game) return <Navigate to="/" replace />
  return (
    <Page>
      <TopBar left={<BackButton to="/pause" />} />
      <h1 className="font-display text-ink mt-4 text-[28px] leading-none">{t('fix.title')}</h1>
      <p className="text-sub mt-2 text-[15px]">{t('fix.subtitle')}</p>
      <div className="mt-5 flex flex-col gap-4 pb-6">
        {TEAM_IDS.map((team) => (
          <section key={team} className="tile p-4">
            <h2 className="kicker" style={{ color: CARD_PALETTE[team].stroke }}>
              {labels.team(game, team)}
            </h2>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-ink text-[16px]">{t('fix.score')}</span>
              <Stepper label={t('fix.score')} value={game.teams[team].score} onMinus={() => adjustScore(team, -1)} onPlus={() => adjustScore(team, 1)} />
            </div>
            {game.pawns
              .filter((p) => p.team === team)
              .map((pawn) => {
                const owner = game.players.find((p) => p.pawn === pawn.id)
                const name = game.mode === 'class' ? t('fix.pawnGroup') : t('fix.pawn', { name: owner?.name ?? '' })
                return (
                  <div key={pawn.id} className="border-mist mt-3 flex items-center justify-between gap-3 border-t-2 pt-3">
                    <span className="text-ink flex min-w-0 items-center gap-2 text-[16px]">
                      <Avatar name={game.mode === 'class' ? (team === 'red' ? 'R' : 'B') : (owner?.name ?? '?')} team={team} size={26} />
                      <span className="truncate">{name}</span>
                    </span>
                    <Stepper label={name} value={squareOf(pawn.distance) + 1} onMinus={() => movePawn(pawn.id, -1)} onPlus={() => movePawn(pawn.id, 1)} />
                  </div>
                )
              })}
          </section>
        ))}
      </div>
    </Page>
  )
}
