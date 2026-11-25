import { Navigate } from 'react-router-dom'
import { Board } from '../components/board/Board'
import { Page, Scene } from '../components/ui'
import { boardPawns, eggStages, useTurn } from '../game/useView'
import { useWakeLock } from '../game/useWakeLock'
import { BonusView, MalusView } from './game/CardViews'
import { EvolveView, HatchView, SpringView } from './game/EggViews'
import { QuestionView } from './game/QuestionView'
import { MoveView, RollView } from './game/TurnViews'
import { useGame } from '../game/useGame'
import { useSettings } from '../settings/useSettings'

export function GameScreen() {
  const { game } = useGame()
  const { settings } = useSettings()
  const turn = useTurn()
  useWakeLock(settings.keepAwake && game?.status === 'playing')
  if (!game || !turn) return <Navigate to="/" replace />
  if (game.status === 'finished') return <Navigate to="/end" replace />
  if (game.status === 'paused') return <Navigate to="/pause" replace />

  const kind = game.phase.kind
  const view = {
    roll: <RollView />,
    move: <MoveView />,
    question: <QuestionView />,
    feedback: <QuestionView />,
    bonus: <BonusView />,
    malus: <MalusView />,
    evolve: <EvolveView />,
    spring: <SpringView />,
    hatch: <HatchView />,
  }[kind]
  const focus = kind === 'move' ? turn.player.pawn : null
  const sceneSeason = kind === 'question' || kind === 'feedback' || kind === 'evolve' || kind === 'hatch' ? null : turn.season

  return (
    <Page
      aside={
        <div className="relative size-full overflow-hidden rounded-[36px] bg-white/40 shadow-[inset_0_0_0_2px_rgba(255,255,255,.7)] backdrop-blur-sm">
          <Board pawns={boardPawns(game)} eggs={eggStages(game)} focus={focus} className="absolute inset-0" />
        </div>
      }
    >
      {kind !== 'evolve' && kind !== 'hatch' && <Scene season={sceneSeason} strong={sceneSeason === null} />}
      {view}
    </Page>
  )
}
