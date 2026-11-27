import { Navigate } from 'react-router-dom'
import { Board } from '../components/board/Board'
import { BackButton, Flags, Scene, SeasonPill, TopBar } from '../components/ui'
import { boardPawns, eggStages, useTurn } from '../game/useView'
import { TeamCards } from './game/parts'
import { useGame } from '../game/useGame'
import { useSettings } from '../settings/useSettings'

export function BoardScreen() {
  const { game } = useGame()
  const { t } = useSettings()
  const turn = useTurn()
  if (!game || !turn) return <Navigate to="/" replace />
  return (
    <div className="flex h-dvh flex-col">
      <Scene season={turn.season} />
      <div className="mx-auto w-full max-w-[460px] px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <TopBar
          left={<BackButton />}
          center={<SeasonPill season={turn.season}>{t('game.round', { season: t(`season.${turn.season}`), n: game.round })}</SeasonPill>}
          right={<Flags />}
        />
      </div>
      <div className="relative min-h-0 flex-1">
        <Board pawns={boardPawns(game)} eggs={eggStages(game)} focus={turn.player.pawn} className="absolute inset-0" />
      </div>
      <div className="mx-auto w-full max-w-[460px] px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <TeamCards game={game} className="mx-auto max-w-[300px]" />
      </div>
    </div>
  )
}
