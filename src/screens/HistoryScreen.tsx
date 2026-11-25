import { useState } from 'react'
import { BackButton, Btn, ConfirmDialog, Page, TopBar } from '../components/ui'
import { findCard } from '../data/cards'
import { TEAM_IDS } from '../game/rules'
import type { GameEvent, GameState, TeamId } from '../game/types'
import { useLabels } from '../game/useView'
import { TEAM_COLOR } from '../theme/colors'
import { formatClock } from '../lib/format'
import { useGame } from '../game/useGame'
import { type TFunction, useSettings } from '../settings/useSettings'

type Filter = 'all' | 'points' | 'cards'

interface Line {
  key: string
  team: TeamId | null
  text: string
  who: string
  points: number
  group: Filter
}

function describe(game: GameState, e: GameEvent, i: number, t: TFunction, teamLabel: (team: TeamId) => string): Line | null {
  const player = 'player' in e ? game.players.find((p) => p.id === e.player) : undefined
  const who = game.mode === 'class' && player ? teamLabel(player.team) : (player?.name ?? '')
  const title = (id: string) => {
    const card = findCard(id)
    return card?.title?.en ?? card?.text.en ?? id
  }
  const category = (id: string) => t(`category.${findCard(id)?.category ?? 'learn'}`)
  const key = `${e.kind}-${i}`
  switch (e.kind) {
    case 'roll':
      return {
        key,
        team: player?.team ?? null,
        who,
        points: 0,
        group: 'all',
        text: t('history.rolled', { a: e.dice[0], b: e.dice[1], n: e.dice[0] + e.dice[1] }),
      }
    case 'answer':
      return {
        key,
        team: e.team,
        who,
        points: e.points,
        group: 'points',
        text: e.correct ? t('history.right', { category: category(e.cardId) }) : t('history.wrongAnswer', { category: category(e.cardId) }),
      }
    case 'challenge':
      return {
        key,
        team: e.winner,
        who: e.winner ? teamLabel(e.winner) : '',
        points: e.points,
        group: 'points',
        text: e.winner ? t('history.challenge') : t('history.challengeNone'),
      }
    case 'bonus':
      return {
        key,
        team: e.team,
        who,
        points: findCard(e.cardId)?.effect?.points ?? 0,
        group: 'cards',
        text: e.kept ? t('history.bonusKept', { card: title(e.cardId) }) : t('history.bonusUsed', { card: title(e.cardId) }),
      }
    case 'malus':
      return {
        key,
        team: e.team,
        who,
        points: e.shielded ? 0 : (findCard(e.cardId)?.effect?.points ?? 0),
        group: 'cards',
        text: e.shielded ? t('history.shield', { card: title(e.cardId) }) : t('history.malus', { card: title(e.cardId) }),
      }
    case 'evolve':
      return {
        key,
        team: e.team,
        who: teamLabel(e.team),
        points: 0,
        group: 'points',
        text: t('history.evolve', { stage: t('evolve.stages').split('|')[e.stage] ?? '' }),
      }
    case 'fix':
      return {
        key,
        team: e.team,
        who: teamLabel(e.team),
        points: e.what === 'score' ? e.delta : 0,
        group: 'points',
        text: e.what === 'score' ? t('history.fixScore') : t('history.fixPawn'),
      }
    default:
      return null
  }
}

export function HistoryScreen() {
  const { game, records, clearRecords } = useGame()
  const { t, settings } = useSettings()
  const labels = useLabels()
  const [filter, setFilter] = useState<Filter>('all')
  const [confirm, setConfirm] = useState(false)
  const date = new Intl.DateTimeFormat(settings.language === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })

  const lines =
    game && game.status !== 'finished'
      ? game.log
          .map((e, i) => describe(game, e, i, t, (team) => labels.team(game, team)))
          .filter((l): l is Line => !!l && (filter === 'all' || l.group === filter))
          .reverse()
      : []

  return (
    <Page>
      <TopBar left={<BackButton />} />
      <h1 className="font-display text-ink mt-4 text-[28px] leading-none">{t('history.title')}</h1>
      {game && game.status !== 'finished' && (
        <>
          <div className="bg-mist mt-4 grid grid-cols-3 gap-2 rounded-2xl p-1">
            {(['all', 'points', 'cards'] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`font-display rounded-xl py-2 text-[15px] transition-all ${filter === f ? 'text-ink bg-white shadow-[0_2px_0_#e5e5e5]' : 'text-sub'}`}
              >
                {t(`history.${f}`)}
              </button>
            ))}
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {lines.length === 0 && <li className="text-sub py-6 text-center">{t('history.empty')}</li>}
            {lines.map((l) => (
              <li key={l.key} className="tile flex items-center gap-3 px-3 py-2.5">
                <span className="size-3 shrink-0 rounded-full" style={{ background: l.team ? TEAM_COLOR[l.team].f : '#AFAFAF' }} />
                <div className="min-w-0 flex-1">
                  <div className="text-ink truncate text-[15px]">{l.text}</div>
                  {l.who && <div className="text-sub truncate text-[12px]">{l.who}</div>}
                </div>
                {l.points !== 0 && (
                  <span className={`font-display text-[16px] tabular-nums ${l.points > 0 ? 'text-green' : 'text-red'}`}>
                    {l.points > 0 ? `+${l.points}` : `−${Math.abs(l.points)}`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 className="kicker text-sub mt-6 mb-2 px-1">{t('history.past')}</h2>
      {records.length === 0 ? (
        <p className="tile text-sub p-4 text-center text-[15px]">{t('history.pastEmpty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {records.map((r) => (
            <li key={r.id} className="tile p-3">
              <div className="text-sub flex justify-between text-[12px]">
                <span>{date.format(r.endedAt)}</span>
                <span>{formatClock(r.playedMs)}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {TEAM_IDS.map((id) => (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ background: r.winner === id ? TEAM_COLOR[id].soft : '#F7F7F7' }}
                  >
                    <span className="text-ink truncate text-[14px]">{r.teams[id].name}</span>
                    <span className="font-display tabular-nums" style={{ color: TEAM_COLOR[id].ink }}>
                      {r.teams[id].score}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sub mt-2 text-[13px]">{r.winner ? t('history.winner', { team: r.teams[r.winner].name }) : t('history.noWinner')}</p>
            </li>
          ))}
        </ul>
      )}
      {records.length > 0 && (
        <Btn color="white" size="sm" className="mt-4 min-h-[48px] w-full" onClick={() => setConfirm(true)}>
          {t('history.clear')}
        </Btn>
      )}
      <div className="h-4" />
      <ConfirmDialog
        open={confirm}
        message={t('history.clearConfirm')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          clearRecords()
          setConfirm(false)
        }}
      />
    </Page>
  )
}
