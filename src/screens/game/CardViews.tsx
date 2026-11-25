import { EggInNest } from '../../components/Egg'
import { BagIcon, BoltIcon, StarIcon } from '../../components/icons'
import { BottomPanel, Btn } from '../../components/ui'
import { findCard } from '../../data/cards'
import { eggStageOf, squareOf } from '../../game/rules'
import { useLabels, useTurn } from '../../game/useView'
import type { Card } from '../../game/types'
import { GameHeader } from './parts'
import { TEAM_COLOR } from '../../theme/colors'
import { useGame } from '../../game/useGame'
import { useSettings } from '../../settings/useSettings'

function BigCard({ card, kind }: { card: Card; kind: 'bonus' | 'malus' }) {
  const { t, settings } = useSettings()
  const bonus = kind === 'bonus'
  const e = card.effect ?? {}
  const tags: string[] = []
  if (!bonus) {
    if (e.points) tags.push(t('malus.tagPoints', { n: `${e.points > 0 ? '+' : '−'}${Math.abs(e.points)}` }))
    if (e.move) tags.push(t('malus.tagMove', { n: Math.abs(e.move) }))
    if (e.skipTurn) tags.push(t('malus.tagSkip'))
  }
  return (
    <div
      className="gloss anim-pop relative mx-auto mt-5 w-[88%] max-w-[330px] overflow-hidden rounded-[30px] px-6 pt-8 pb-6 text-center"
      style={{ background: bonus ? '#FFC800' : '#CE82FF', boxShadow: `0 6px 0 ${bonus ? '#E0A800' : '#A568CC'}, 0 18px 30px rgba(40,40,60,.18)` }}
    >
      <span className="absolute top-4 left-5 text-white/90" style={{ animation: 'twinkle 2.2s infinite' }}>
        ✦
      </span>
      <span className="absolute right-6 bottom-24 text-white/80" style={{ animation: 'twinkle 2.8s .6s infinite' }}>
        ✦
      </span>
      <span className="mx-auto grid size-24 place-items-center rounded-full bg-white [&>svg]:size-12" style={{ color: bonus ? '#FFC800' : '#CE82FF' }}>
        {bonus ? <StarIcon /> : <BoltIcon />}
      </span>
      <div className="kicker mt-5 text-[12px] text-white/85">{t(bonus ? 'bonus.card' : 'malus.card')}</div>
      <h2 className="font-display mt-1 text-[28px] leading-tight text-white">{card.title?.en}</h2>
      <p className="mt-2 text-[16px] leading-snug text-white">{card.text.en}</p>
      {settings.language === 'fr' && <p className="mt-1 text-[13px] leading-snug text-white/80">{card.text.fr}</p>}
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {tags.map((tag, i) => (
            <span
              key={tag}
              className="font-display rounded-full px-3 py-1 text-[12px] text-white uppercase"
              style={{ background: i === 0 && e.points ? '#FF4B4B' : 'rgba(255,255,255,.25)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function BonusView() {
  const turn = useTurn()!
  const { game, player, season } = turn
  const { t } = useSettings()
  const { bonus } = useGame()
  const labels = useLabels()
  if (game.phase.kind !== 'bonus') return null
  const card = findCard(game.phase.cardId)
  if (!card) return null
  const name = game.mode === 'class' ? labels.team(game, player.team) : player.name
  const shieldOnly = card.effect?.shield
  return (
    <>
      <GameHeader game={game} season={season} />
      <h1 className="font-display text-ink mt-5 text-[28px] leading-none">{t('bonus.title')}</h1>
      <p className="text-sub mt-2 text-[15px]">{t('bonus.subtitle', { name })}</p>
      <BigCard card={card} kind="bonus" />
      <BottomPanel className="mt-8">
        {card.keep ? (
          <>
            <p className="text-sub mb-3 text-center text-[15px]">{t('bonus.canKeep')}</p>
            <div className={`grid gap-3 ${shieldOnly ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <Btn color={shieldOnly ? 'yellow' : 'white'} onClick={() => bonus(true)}>
                <BagIcon />
                {t('bonus.keep')}
              </Btn>
              {!shieldOnly && (
                <Btn color="yellow" shine onClick={() => bonus(false)}>
                  {t('bonus.useNow')}
                </Btn>
              )}
            </div>
            <p className="text-sub mt-3 text-center text-[13px]">{t('bonus.bagNote')}</p>
          </>
        ) : (
          <Btn color="yellow" shine className="w-full" onClick={() => bonus(false)}>
            {t('bonus.ok')}
          </Btn>
        )}
      </BottomPanel>
    </>
  )
}

export function MalusView() {
  const turn = useTurn()!
  const { game, player, pawn, season } = turn
  const { t } = useSettings()
  const { malus } = useGame()
  const labels = useLabels()
  if (game.phase.kind !== 'malus') return null
  const card = findCard(game.phase.cardId)
  if (!card) return null
  const team = game.teams[player.team]
  const name = game.mode === 'class' ? labels.team(game, player.team) : player.name
  const e = card.effect ?? {}
  const after = Math.max(0, team.score + (e.points ?? 0))
  const shield = team.kept.some((id) => findCard(id)?.effect?.shield)
  const consequence = e.skipTurn
    ? t('malus.skip', { name })
    : e.move
      ? t('malus.goesTo', { name, n: squareOf(Math.max(0, pawn.distance + e.move)) + 1 })
      : e.points
        ? ''
        : t('malus.rule')
  return (
    <>
      <GameHeader game={game} season={season} />
      <h1 className="font-display text-ink mt-5 text-[28px] leading-none">{t('malus.title')}</h1>
      <p className="text-sub mt-2 text-[15px]">{t('malus.subtitle', { name })}</p>
      <div className="anim-shiver">
        <BigCard card={card} kind="malus" />
      </div>
      <BottomPanel className="mt-8">
        <div className="flex items-center gap-3">
          <EggInNest team={player.team} stage={eggStageOf(team.score)} mood="shiver" className="w-28 shrink-0" />
          <div className="min-w-0">
            <div className="text-[14px]" style={{ color: TEAM_COLOR[player.team].ink }}>
              {labels.team(game, player.team)}
            </div>
            {e.points ? (
              <div className="font-display text-ink text-[22px] leading-tight">{t('malus.pointsChange', { from: team.score, to: after })}</div>
            ) : null}
            {consequence && <div className="text-sub text-[14px]">{consequence}</div>}
          </div>
        </div>
        {shield && (
          <Btn color="green" className="mt-4 w-full" onClick={() => malus(true)}>
            {t('malus.shield')}
          </Btn>
        )}
        <Btn color="purple" shine className="mt-3 w-full" onClick={() => malus(false)}>
          {t('malus.apply')}
        </Btn>
      </BottomPanel>
    </>
  )
}
