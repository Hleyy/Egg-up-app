import { useNavigate } from 'react-router-dom'
import { TeamCard } from '../../components/TeamCard'
import type { EggMood } from '../../components/Egg'
import { MapIcon } from '../../components/icons'
import { Flags, IconBtn, PauseButton, SeasonPill, TopBar } from '../../components/ui'
import { GOAL_POINTS, eggStageOf, TEAM_IDS } from '../../game/rules'
import { useLabels } from '../../game/useView'
import type { GameState, Season, SquareType, TeamId } from '../../game/types'
import { currentPlayer } from '../../game/selectors'
import { useSettings } from '../../settings/useSettings'

export function GameHeader({ game, season, board = true }: { game: GameState; season: Season; board?: boolean }) {
  const { t } = useSettings()
  const navigate = useNavigate()
  return (
    <TopBar
      left={<PauseButton />}
      center={<SeasonPill season={season}>{t('game.round', { season: t(`season.${season}`), n: game.round })}</SeasonPill>}
      right={
        <div className="flex items-center gap-2">
          {board && (
            <IconBtn label={t('game.board')} onClick={() => navigate('/board')} className="lg:hidden">
              <MapIcon />
            </IconBtn>
          )}
          <Flags />
        </div>
      }
    />
  )
}

export function TeamCards({
  game,
  moods,
  moodKey,
  className = '',
}: {
  game: GameState
  moods?: Partial<Record<TeamId, EggMood>>
  moodKey?: string | number
  className?: string
}) {
  const { t } = useSettings()
  const labels = useLabels()
  const navigate = useNavigate()
  const player = currentPlayer(game)
  return (
    <div className={`grid grid-cols-2 gap-3 px-1 ${className}`}>
      {TEAM_IDS.map((team) => {
        const tm = game.teams[team]
        const pawns = game.players.filter((p) => p.team === team).map((p) => ({ id: p.id, name: p.name, animal: p.animal, active: p.id === player.id }))
        return (
          <TeamCard
            key={team}
            team={team}
            label={labels.team(game, team)}
            score={tm.score}
            goal={GOAL_POINTS}
            stage={eggStageOf(tm.score)}
            pawns={game.mode === 'class' ? pawns.map((p) => ({ ...p, name: team === 'red' ? 'R' : 'B' })) : pawns}
            kept={tm.kept.length}
            current={player.team === team}
            turnLabel={t('game.yourTurn')}
            mood={moods?.[team]}
            moodKey={moodKey}
            onKept={() => navigate(`/bag/${team}`)}
          />
        )
      })}
    </div>
  )
}

export function SquareIcon({ type, size = 44 }: { type: SquareType; size?: number }) {
  return (
    <svg viewBox="-20 -20 40 40" width={size} height={size} aria-hidden="true" className="shrink-0">
      {type === 'neutral' && (
        <>
          <rect x="-16" y="-14" width="34" height="30" rx="10" fill="#000" fillOpacity=".12" />
          <rect x="-17" y="-15" width="34" height="30" rx="10" fill="#FFFBEE" stroke="#E9D2A1" strokeWidth="2" />
        </>
      )}
      {type !== 'neutral' && (
        <>
          <circle r="18" fill="#fff" />
          <circle r="15.5" fill={{ start: '#F86283', team: '#62E0C3', bonus: '#FFD04F', malus: '#FF6451' }[type]} />
        </>
      )}
      {type === 'start' && (
        <>
          <rect x="-6" y="-12" width="2.4" height="25" rx="1" fill="#fff" />
          <path d="M-3.6 -12L10 -7L-3.6 -2Z" fill="#FFE27A" />
        </>
      )}
      {type === 'team' && (
        <>
          <rect x="-11" y="-5" width="5" height="10" rx="1.5" fill="#229786" />
          <rect x="6" y="-5" width="5" height="10" rx="1.5" fill="#229786" />
          <path d="M-6 -3Q0 -6 6 -3V3L2 6H-2L-6 3Z" fill="#fff" />
          <circle cx="-3" cy="6" r="1.8" fill="#fff" />
          <circle cx="0" cy="6.6" r="1.8" fill="#fff" />
          <circle cx="3" cy="5.6" r="1.8" fill="#fff" />
          <path d="M-4 -1Q0 1.5 4 -1" fill="none" stroke="#229786" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {type === 'bonus' && (
        <path
          d="M0 -9.5L2.35 -3.24L9.04 -2.94L3.8 1.24L5.58 7.69L0 4L-5.58 7.69L-3.8 1.24L-9.04 -2.94L-2.35 -3.24Z"
          fill="#fff"
          stroke="#DC9B1B"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      )}
      {type === 'malus' && (
        <>
          <circle r="9" fill="#FFF0E6" />
          <circle cx="-3.2" cy="-0.5" r="1.3" fill="#612519" />
          <circle cx="3.2" cy="-0.5" r="1.3" fill="#612519" />
          <path d="M-6 -4.5L-1.5 -2.5M6 -4.5L1.5 -2.5" stroke="#612519" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M-3.5 5.5Q0 2 3.5 5.5" fill="none" stroke="#612519" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
