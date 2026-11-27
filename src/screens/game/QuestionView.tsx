import { useEffect, useRef, useState } from 'react'
import { Animal } from '../../components/animals/Animal'
import { useTalk } from '../../components/animals/useTalk'
import { CheckIcon, ClockIcon, CloseIcon, ReplayIcon, StarIcon } from '../../components/icons'
import { Burst } from '../../components/Burst'
import { Avatar, Btn, PauseButton, Pill, Sheet, TopBar } from '../../components/ui'
import { findCard } from '../../data/cards'
import { ANSWER_SECONDS, POINTS } from '../../game/rules'
import { useLabels, useTurn } from '../../game/useView'
import type { AnimalId, Card, Category, Season } from '../../game/types'
import { SEASON_COLOR, TEAM_COLOR } from '../../theme/colors'
import { formatClock } from '../../lib/format'
import { useGame } from '../../game/useGame'
import { useSettings } from '../../settings/useSettings'
import { animalOf } from '../../game/voices'

const CATEGORY_COLOR: Record<Category, [string, string]> = {
  learn: ['#58CC02', '#58A700'],
  understand: ['#1CB0F6', '#1899D6'],
  apply: ['#FF9600', '#E07F00'],
  challenge: ['#FF4B4B', '#EA2B2B'],
}

function AnswerTimer({ running, resetKey }: { running: boolean; resetKey: string }) {
  const [left, setLeft] = useState(ANSWER_SECONDS * 1000)
  const [key, setKey] = useState(resetKey)
  if (key !== resetKey) {
    setKey(resetKey)
    setLeft(ANSWER_SECONDS * 1000)
  }
  const leftRef = useRef(left)
  useEffect(() => {
    leftRef.current = left
  })
  useEffect(() => {
    if (!running) return
    const end = performance.now() + leftRef.current
    const id = window.setInterval(() => setLeft(Math.max(0, end - performance.now())), 200)
    return () => window.clearInterval(id)
  }, [running, resetKey])
  const ratio = left / (ANSWER_SECONDS * 1000)
  const color = left <= 10_000 ? '#FF4B4B' : '#FF9600'
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5" role="timer" aria-live="off">
      <ClockIcon className="size-6 shrink-0" style={{ color }} />
      <div className="bg-line relative h-4 flex-1 overflow-hidden rounded-full">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-200 ease-linear"
          style={{ width: `${ratio * 100}%`, background: color }}
        >
          <div className="absolute top-1 right-2 left-2 h-[3px] rounded-full bg-white/50" />
        </div>
      </div>
      <span className="font-display w-11 text-right text-[16px] tabular-nums" style={{ color }}>
        {formatClock(left)}
      </span>
    </div>
  )
}

function SeasonWindow({
  season,
  host,
  card,
  speech,
  cue,
  cueKey,
  replay,
}: {
  season: Season
  host: AnimalId
  card: Card
  speech: ReturnType<typeof useTalk>
  cue: 'ask' | 'correct' | 'wrong'
  cueKey: string
  replay?: () => void
}) {
  const { t } = useSettings()
  return (
    <div className="relative mt-4 aspect-[358/250] w-full overflow-hidden rounded-[24px] shadow-[inset_0_0_0_2px_rgba(255,255,255,.7),0_4px_0_#e5e5e5]">
      <div className="absolute inset-0 scale-110 bg-cover bg-[center_65%]" style={{ backgroundImage: `url(/decors/${season}.webp)` }} />
      <Animal animal={host} talking={speech.talking} viseme={speech.viseme} cue={cue} cueKey={cueKey} className="absolute bottom-[-4%] left-[3%] w-[40%]" />
      <div className="anim-pop text-ink absolute top-[7%] right-[3%] w-[56%] rounded-[20px] bg-white px-4 py-3 text-left text-[clamp(15px,4.3vw,18px)] leading-snug shadow-[inset_0_0_0_2px_#e5e5e5,0_4px_0_#e5e5e5]">
        {card.text.en}
        <svg className="absolute top-[45%] -left-[11px]" width="14" height="22" viewBox="0 0 14 22" aria-hidden="true">
          <path d="M14 1 L2 11 L14 21Z" fill="#fff" />
          <path d="M13 1 L2 11 L13 21" fill="none" stroke="#e5e5e5" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        {replay && (
          <button
            type="button"
            aria-label={t('question.replay')}
            onClick={replay}
            className="text-blue absolute -right-1 -bottom-5 flex size-10 items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_2px_#e5e5e5,0_3px_0_#e5e5e5] active:translate-y-0.5 active:shadow-none"
          >
            <ReplayIcon className="size-5" />
          </button>
        )}
      </div>
    </div>
  )
}

export function QuestionView() {
  const turn = useTurn()!
  const { game, player, season } = turn
  const { t, settings, buzz, play, voice } = useSettings()
  const { answer, challenge, next } = useGame()
  const labels = useLabels()
  const speech = useTalk()
  const [shown, setShown] = useState(false)
  const phase = game.phase
  const cardId = phase.kind === 'question' || phase.kind === 'feedback' ? phase.cardId : ''
  const card = findCard(cardId)
  const say = speech.say
  const text = card?.text.en ?? ''
  const src = cardId ? voice(cardId) : undefined

  useEffect(() => {
    if (phase.kind !== 'question' || !text) return
    const id = window.setTimeout(() => say(text, src), 450)
    return () => window.clearTimeout(id)
  }, [cardId, text, src, say, phase.kind])

  if (!card || (phase.kind !== 'question' && phase.kind !== 'feedback')) return null
  const isChallenge = card.category === 'challenge'
  const isClass = game.mode === 'class'
  const square = phase.square
  const sc = SEASON_COLOR[season]
  const [cc, cl] = CATEGORY_COLOR[card.category ?? 'learn']
  const teamLabel = labels.team(game, player.team)
  const title = isChallenge
    ? t('challenge.title')
    : square === 'team'
      ? t(isClass ? 'question.groupTogether' : 'question.together', { team: teamLabel })
      : isClass
        ? t('question.groupAlone')
        : t('question.alone', { name: player.name })
  const feedback = phase.kind === 'feedback' ? phase : null
  const cue = feedback ? (feedback.correct ? 'correct' : 'wrong') : 'ask'
  const reveal = shown || !!feedback

  const judge = (correct: boolean) => {
    speech.stop()
    buzz(correct ? [20, 60, 30] : [60, 40, 60])
    play(correct ? 'right' : 'wrong')
    answer(correct)
  }

  return (
    <>
      <TopBar left={<PauseButton />} center={settings.answerTimer ? <AnswerTimer running={!feedback && !reveal} resetKey={cardId} /> : undefined} />
      <h1 className="font-display text-ink mt-4 text-[26px] leading-tight">{title}</h1>
      <p className="text-sub mt-1 text-[14px]">{isChallenge ? t('challenge.subtitle') : t(`squareRule.${square}`)}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Pill color={cc} lip={cl}>
          {t(`category.${card.category ?? 'learn'}`)}
        </Pill>
        <Pill color={sc.f} lip={sc.l}>
          {t('deck')}
        </Pill>
        {!isChallenge && square === 'team' && !isClass && (
          <span className="ml-auto flex -space-x-1.5">
            {game.players
              .filter((p) => p.team === player.team)
              .map((p) => (
                <Avatar key={p.id} name={p.name} team={p.team} size={28} />
              ))}
          </span>
        )}
      </div>

      <SeasonWindow
        season={season}
        host={animalOf(card.id) ?? player.animal}
        card={card}
        speech={speech}
        cue={cue}
        cueKey={`${cardId}-${phase.kind}`}
        replay={feedback || !src ? undefined : () => say(text, src)}
      />

      {card.choices && (
        <ol className="mt-3 grid gap-2">
          {card.choices.en.map((choice, i) => (
            <li
              key={choice}
              className="stagger flex items-start gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[inset_0_0_0_2px_#ececec,0_3px_0_#ececec]"
              style={{ ['--i' as string]: i }}
            >
              <span className="font-display grid size-7 shrink-0 place-items-center rounded-full text-[14px] text-white" style={{ background: sc.f }}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-ink pt-0.5 text-[15px] leading-snug">
                {choice}
                {settings.language === 'fr' && card.choices?.fr[i] && <span className="text-sub block text-[13px]">{card.choices.fr[i]}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}

      {isChallenge ? (
        <div className="bg-yellow-soft mt-4 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[15px] text-[#9A6B00] shadow-[inset_0_0_0_2px_#FFE58A,0_3px_0_#FFE58A]">
          <StarIcon className="text-yellow size-6" />
          {t('challenge.stake', { n: POINTS.challenge })}
        </div>
      ) : reveal ? (
        <div className="anim-rise bg-mist mt-4 rounded-2xl px-4 py-3 shadow-[inset_0_0_0_2px_#ececec]">
          <div className="kicker text-sub text-[11px]">{t('question.answer')}</div>
          <p className="text-ink mt-1 text-[16px] leading-snug">{card.answer?.en}</p>
          {settings.language === 'fr' && card.answer?.fr && <p className="text-sub mt-1 text-[13px] leading-snug">{card.answer.fr}</p>}
        </div>
      ) : (
        <button type="button" className="tile text-blue mt-4 py-4 text-[15px] active:translate-y-1" onClick={() => setShown(true)}>
          {t('question.showAnswer')}
        </button>
      )}
      {settings.language === 'fr' && <p className="text-sub mt-2 px-1 text-[13px] leading-snug">{card.text.fr}</p>}

      {!feedback && (
        <div className="from-paper via-paper to-paper/0 sticky bottom-0 -mx-4 mt-auto bg-gradient-to-t px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
          {isChallenge ? (
            <>
              <p className="text-sub mb-3 text-center text-[15px]">{t('challenge.who')}</p>
              <div className="grid grid-cols-2 gap-3">
                <Btn color="red" onClick={() => challenge('red')}>
                  {labels.team(game, 'red')}
                </Btn>
                <Btn color="blue" onClick={() => challenge('blue')}>
                  {labels.team(game, 'blue')}
                </Btn>
              </div>
              <Btn color="white" className="mt-3 w-full" onClick={() => challenge(null)}>
                {t('challenge.nobody')}
              </Btn>
            </>
          ) : (
            <>
              <p className="text-sub mb-3 text-center text-[15px]">{t('question.wasRight')}</p>
              <div className="grid grid-cols-2 gap-3">
                <Btn color="red" onClick={() => judge(false)}>
                  <CloseIcon />
                  {t('question.wrong')}
                </Btn>
                <Btn color="green" onClick={() => judge(true)}>
                  <CheckIcon />
                  {t('question.right')}
                </Btn>
              </div>
            </>
          )}
        </div>
      )}

      {feedback && (
        <FeedbackSheet
          card={card}
          correct={feedback.correct}
          points={feedback.points}
          isChallenge={isChallenge}
          winner={feedback.team}
          name={isClass ? teamLabel : player.name}
          onNext={next}
        />
      )}
    </>
  )
}

function FeedbackSheet({
  card,
  correct,
  points,
  isChallenge,
  winner,
  name,
  onNext,
}: {
  card: Card
  correct: boolean
  points: number
  isChallenge: boolean
  winner: 'red' | 'blue' | null
  name: string
  onNext: () => void
}) {
  const { t, settings } = useSettings()
  const { game } = useGame()
  const labels = useLabels()
  const good = correct
  const tone = good ? 'good' : 'bad'
  const ink = good ? '#58A700' : '#EA2B2B'
  const teamName = winner ? labels.team(game, winner) : ''
  const title = isChallenge
    ? winner
      ? t('feedback.challengeWon', { team: teamName })
      : t('feedback.challengeNone')
    : good
      ? t('feedback.right', { name })
      : t('feedback.wrong')
  const detail = isChallenge
    ? winner
      ? t('feedback.rightDetail', { n: points, team: t(`team.${winner}`).toLowerCase() })
      : t('feedback.challengeNoneDetail')
    : good
      ? t('feedback.rightDetail', { n: points, team: winner ? t(`team.${winner}`).toLowerCase() : '' })
      : t('feedback.wrongDetail')
  return (
    <>
      <div className="fixed inset-0 z-20 bg-[#22202A]/15" style={{ animation: 'fade-in .3s both' }} />
      <Sheet tone={tone}>
        <div className="flex items-center gap-3">
          <span
            className={`relative grid size-12 shrink-0 place-items-center rounded-full bg-white [&>svg]:size-7 ${good ? 'anim-pop' : 'shake-x'}`}
            style={{ color: winner && isChallenge ? TEAM_COLOR[winner].f : ink }}
          >
            {good ? <CheckIcon /> : <CloseIcon />}
            {good && <Burst colors={['#FFC800', '#58CC02', winner ? TEAM_COLOR[winner].f : '#1CB0F6', '#FF9600']} />}
            {good && points > 0 && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2">
                <span className="points-rise font-display block text-[22px] text-[#E0A800] [-webkit-text-stroke:4px_#fff] [paint-order:stroke_fill]">
                  +{points}
                </span>
              </span>
            )}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-[22px] leading-tight" style={{ color: ink }}>
              {title}
            </h2>
            <p className="text-[14px]" style={{ color: ink }}>
              {detail}
            </p>
          </div>
        </div>
        {card.funFact && (
          <div className="anim-rise mt-4 rounded-2xl bg-white px-4 py-3">
            <div className="kicker flex items-center gap-1.5 text-[11px] text-[#E0A800]">
              <StarIcon className="text-yellow size-4" />
              {t('feedback.funFact')}
            </div>
            <p className="text-ink mt-1 text-[15px] leading-snug">{settings.language === 'fr' ? card.funFact.fr : card.funFact.en}</p>
          </div>
        )}
        <Btn shine color={good ? 'green' : 'red'} className="mt-4 w-full" onClick={onNext}>
          {t('common.continue')}
        </Btn>
      </Sheet>
    </>
  )
}
