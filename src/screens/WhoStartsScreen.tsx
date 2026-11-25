import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Animal } from '../components/animals/Animal'
import { useSpeech } from '../components/animals/useSpeech'
import { DicePair } from '../components/Dice'
import { CardFrame, ScoreText } from '../components/TeamCard'
import { BackButton, BottomPanel, Btn, Bubble, Page, Progress, Scene, TopBar } from '../components/ui'
import { DiceIcon } from '../components/icons'
import { loadDraft, toSetup } from '../game/draft'
import { rollDice, TEAM_IDS } from '../game/rules'
import type { TeamId } from '../game/types'
import { CARD_PALETTE } from '../theme/colors'
import { useGame } from '../game/useGame'
import { useSettings } from '../settings/useSettings'

type Rolls = Record<TeamId, [number, number] | null>

export function WhoStartsScreen() {
  const { t, settings, buzz } = useSettings()
  const { newGame } = useGame()
  const navigate = useNavigate()
  const [draft] = useState(() => loadDraft({ mode: 'teams', teams: null as never }))
  const [rolls, setRolls] = useState<Rolls>({ red: null, blue: null })
  const [tie, setTie] = useState(false)
  const speech = useSpeech(settings.voice)

  const sum = (r: [number, number] | null) => (r ? r[0] + r[1] : 0)
  const done = rolls.red && rolls.blue && sum(rolls.red) !== sum(rolls.blue)
  const winner: TeamId | null = done ? (sum(rolls.red) > sum(rolls.blue) ? 'red' : 'blue') : null
  const label = (team: TeamId) => t(draft?.mode === 'class' ? `group.${team}` : `team.${team}`)
  const firstName =
    winner && draft?.teams
      ? draft.mode === 'class'
        ? draft.teams.class[winner].name
        : draft.teams.teams[winner].players[0]?.trim() || t('setup.player', { n: 1 })
      : ''
  const line = winner ? t('starts.hostStarts', { team: label(winner), name: firstName }) : t('starts.hostReady')

  const say = speech.say
  const spoken = winner ? t('starts.hostStarts', { team: t(`team.${winner}`), name: firstName }) : ''
  useEffect(() => {
    if (!spoken) return
    const id = window.setTimeout(() => say(spoken), 900)
    return () => window.clearTimeout(id)
  }, [spoken, say])

  if (!draft?.teams) return <Navigate to="/setup" replace />

  const roll = (team: TeamId) => {
    if (rolls[team] && !tie) return
    buzz(20)
    const value = rollDice()
    setRolls((r) => {
      const base = tie ? { red: null, blue: null } : r
      const next = { ...base, [team]: value }
      setTie(!!(next.red && next.blue && sum(next.red) === sum(next.blue)))
      return next
    })
  }
  const nextTeam: TeamId | null = !rolls.red || tie ? 'red' : !rolls.blue ? 'blue' : null

  const start = () => {
    if (!winner) return
    newGame(toSetup(draft, winner, settings.gameTimer ? settings.timerMinutes : null))
    navigate('/game', { replace: true })
  }

  return (
    <Page>
      <Scene season="summer" />
      <TopBar left={<BackButton to="/setup" />} center={<Progress value={1} color="#58CC02" lip="#58A700" className="w-full" />} />
      <h1 className="font-display text-ink mt-5 text-[28px] leading-none">{t('starts.title')}</h1>
      <p className="text-sub mt-2 text-[15px]">{t('starts.subtitle')}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {TEAM_IDS.map((team) => {
          const r = rolls[team]
          const p = CARD_PALETTE[team]
          const isWinner = winner === team
          return (
            <button
              key={team}
              type="button"
              onClick={() => roll(team)}
              className={`[container-type:inline-size] relative aspect-[171/200] transition-transform duration-300 ${isWinner ? '-translate-y-1' : winner ? 'opacity-80 saturate-75' : ''}`}
              style={{ transitionTimingFunction: 'cubic-bezier(.3,1.5,.5,1)', filter: isWinner ? 'drop-shadow(0 10px 16px rgba(40,60,40,.2))' : undefined }}
            >
              <CardFrame team={team} />
              <span
                className="font-display absolute top-[3.5%] left-[8.5%] rounded-full px-[6%] py-[1%] text-[clamp(9px,6.4cqw,13px)] text-white uppercase"
                style={{ background: p.pill, boxShadow: `inset 0 0 0 1px ${p.pillLine}` }}
              >
                {label(team)}
              </span>
              <span className="absolute inset-x-0 top-[18%] flex justify-center">
                <DicePair values={r} size={46} />
              </span>
              <span className="absolute inset-x-0 top-[58%] text-center leading-none">
                {r ? (
                  <ScoreText team={team} className="anim-pop text-[clamp(30px,26cqw,48px)]">
                    {sum(r)}
                  </ScoreText>
                ) : (
                  <span className="font-display text-[clamp(12px,8cqw,15px)] uppercase" style={{ color: p.stroke }}>
                    {t('starts.tapToRoll')}
                  </span>
                )}
              </span>
              <span className="absolute inset-x-0 bottom-[8%] flex justify-center">
                {isWinner ? (
                  <span className="gloss anim-pop bg-yellow font-display rounded-full px-3 py-1 text-[12px] text-white uppercase shadow-[0_2px_0_#E0A800]">
                    {t('starts.starts')}
                  </span>
                ) : (
                  r && (
                    <span className="font-display text-[12px] uppercase" style={{ color: p.stroke }}>
                      {t('starts.total')}
                    </span>
                  )
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex h-8 justify-center">
        {tie && <span className="glass anim-pop text-ink rounded-full px-4 py-1.5 text-[14px]">{t('starts.tie')}</span>}
      </div>

      <div className="relative mt-auto flex items-end gap-2 pb-2">
        <Animal
          animal="goat"
          talking={speech.talking}
          viseme={speech.viseme}
          cue={winner ? 'correct' : 'hello'}
          cueKey={winner ?? 'x'}
          className="w-[38%] max-w-[170px] shrink-0"
        />
        <Bubble className="anim-rise mb-10 flex-1" key={line}>
          {line}
        </Bubble>
      </div>

      <BottomPanel>
        {winner ? (
          <Btn shine className="w-full" onClick={start}>
            {t('starts.letsPlay')}
          </Btn>
        ) : (
          <Btn color="blue" className="w-full" onClick={() => nextTeam && roll(nextTeam)}>
            <DiceIcon />
            {nextTeam ? `${t('starts.roll')} · ${label(nextTeam)}` : t('starts.roll')}
          </Btn>
        )}
      </BottomPanel>
    </Page>
  )
}
