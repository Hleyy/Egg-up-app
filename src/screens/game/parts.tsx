import { useNavigate } from 'react-router-dom'
import { TeamCard } from '../../components/TeamCard'
import type { EggMood } from '../../components/Egg'
import { ClockIcon, MapIcon } from '../../components/icons'
import { formatClock } from '../../lib/format'
import { useGame } from '../../game/useGame'
import { Flags, IconBtn, PauseButton, SeasonPill, TopBar } from '../../components/ui'
import { GOAL_POINTS, eggStageOf, TEAM_IDS } from '../../game/rules'
import { useLabels } from '../../game/useView'
import type { GameState, Season, SquareType, TeamId } from '../../game/types'
import { currentPlayer } from '../../game/selectors'
import { useSettings } from '../../settings/useSettings'

function GameClock() {
  const { remaining, elapsed } = useGame()
  const { t } = useSettings()
  const urgent = remaining !== null && remaining < 120_000
  return (
    <span
      role="timer"
      aria-label={t('game.clock')}
      className={`glass font-display flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] tabular-nums [&>svg]:size-3.5 ${urgent ? 'text-red animate-pulse' : 'text-ink'}`}
    >
      <ClockIcon />
      {formatClock(remaining ?? elapsed)}
    </span>
  )
}

export function GameHeader({ game, season, board = true }: { game: GameState; season: Season; board?: boolean }) {
  const { t } = useSettings()
  const navigate = useNavigate()
  return (
    <TopBar
      left={<PauseButton />}
      center={
        <div className="flex flex-col items-center gap-1">
          <SeasonPill season={season}>{t('game.round', { season: t(`season.${season}`), n: game.round })}</SeasonPill>
          <GameClock />
        </div>
      }
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
  return <img src={`/squares/${type}.svg`} alt="" width={size} height={size} className="shrink-0" />
}
