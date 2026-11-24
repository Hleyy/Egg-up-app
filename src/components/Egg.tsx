import type { EggStage, TeamId } from '../game/types'
import { useSettings } from '../settings/SettingsProvider'

const STAGE_INDEX: Record<EggStage, number> = { egg: 1, wobble: 2, crack: 3, peek: 4, hatched: 5 }

export function Egg({ stage, team, size = 56 }: { stage: EggStage; team: TeamId; size?: number }) {
  const { t } = useSettings()
  return (
    <div className="flex flex-col items-center gap-1" data-stage={stage} data-team={team}>
      <div
        className={`flex items-center justify-center rounded-[50%/60%_60%_40%_40%] border-2 border-dashed font-bold ${team === 'red' ? 'border-team-red' : 'border-team-blue'}`}
        style={{ width: size, height: size * 1.25 }}
        aria-label={t(`egg.${stage}`)}
      >
        {STAGE_INDEX[stage]}/5
      </div>
      <span className="text-xs text-ink-muted">{t(`egg.${stage}`)}</span>
    </div>
  )
}
