import { currentPlayer, pawnOf } from './selectors'
import { eggStageOf, seasonOf } from './rules'
import type { BoardPawn } from '../components/board/types'
import type { EggStage, GameState, Player, TeamId } from './types'
import { initial } from '../lib/format'
import { useGame } from './useGame'
import { useSettings } from '../settings/useSettings'

export function useLabels() {
  const { t } = useSettings()
  return {
    team: (game: GameState | null, team: TeamId) => t(game?.mode === 'class' ? `group.${team}` : `team.${team}`),
  }
}

export function boardPawns(game: GameState): BoardPawn[] {
  const player = currentPlayer(game)
  return game.pawns.map((p) => {
    const owner = game.players.find((pl) => pl.pawn === p.id)
    return { id: p.id, team: p.team, distance: p.distance, label: initial(owner?.name ?? p.team), animal: owner?.animal ?? 'fox', active: p.id === player.pawn }
  })
}

export function eggStages(game: GameState): Record<TeamId, EggStage> {
  return { red: eggStageOf(game.teams.red.score), blue: eggStageOf(game.teams.blue.score) }
}

export function useTurn() {
  const { game } = useGame()
  if (!game) return null
  const player: Player = currentPlayer(game)
  const pawn = pawnOf(game, player)
  return { game, player, pawn, season: seasonOf(pawn.distance) }
}
