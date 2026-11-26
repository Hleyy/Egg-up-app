import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Animal } from '../components/animals/Animal'
import { CloseIcon, ClockIcon, StarIcon } from '../components/icons'
import { BackButton, Btn, Flags, Page, Scene, TopBar } from '../components/ui'
import { AR_CHALLENGE, RECYCLABLE_COUNT, type ArItem } from '../data/ar'
import { ArStage } from '../ar/ArStage'
import { POINTS } from '../game/rules'
import { useTurn } from '../game/useView'
import { formatClock } from '../lib/format'
import { useSettings } from '../settings/useSettings'

type Phase = 'intro' | 'loading' | 'play' | 'end' | 'error'

interface Toast {
  key: number
  text: string
  tone: 'good' | 'bad'
}

function shuffle<T>(list: T[]) {
  return list
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.value)
}

export function ArScreen() {
  const turn = useTurn()
  const { t, settings, play, buzz } = useSettings()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(0)

  const finish = () => navigate(turn ? '/game' : '/')

  if (phase === 'intro' || phase === 'error') {
    return (
      <Page>
        <Scene season="summer" />
        <TopBar left={<BackButton />} right={<Flags />} />
        <div className="flex flex-1 flex-col justify-center py-6">
          <section className="tile anim-pop relative mx-auto w-full max-w-[400px] overflow-hidden p-5 pt-4">
            <div className="flex items-end gap-3">
              <Animal animal={turn?.player.animal ?? 'fox'} cue="hello" cueKey={phase} className="w-[34%] shrink-0" />
              <div className="pb-3">
                <div className="kicker text-red text-[12px]">AR · Challenge</div>
                <h1 className="font-display text-ink mt-1 text-[28px] leading-[1.05]">{t('ar.title')}</h1>
              </div>
            </div>
            <p className="text-ink mt-4 text-[16px] leading-snug">{t('ar.intro')}</p>
            <p className="text-sub mt-2 text-[14px] leading-snug">{t('ar.goal', { n: RECYCLABLE_COUNT, s: AR_CHALLENGE.seconds })}</p>
            <img src="/ar/card.webp" alt="" className="mt-4 w-full rounded-2xl shadow-[0_4px_0_#e5e5e5]" />
            {phase === 'error' && <p className="bg-red-soft text-red mt-4 rounded-2xl px-4 py-3 text-[14px] leading-snug">{t('ar.noCamera')}</p>}
          </section>
          <Btn color="green" shine className="stagger mx-auto mt-5 w-full max-w-[400px]" style={{ ['--i' as string]: 2 }} onClick={() => setPhase('loading')}>
            {t('ar.start')}
          </Btn>
        </div>
      </Page>
    )
  }

  return (
    <ArGame
      key={round}
      lang={settings.language}
      t={t}
      play={play}
      buzz={buzz}
      onError={() => setPhase('error')}
      onReady={() => setPhase('play')}
      onEnd={() => setPhase('end')}
      ended={phase === 'end'}
      loading={phase === 'loading'}
      onAgain={() => {
        setRound((r) => r + 1)
        setPhase('loading')
      }}
      onExit={finish}
      exitLabel={turn ? t('ar.back') : t('ar.home')}
    />
  )
}

type T = ReturnType<typeof useSettings>['t']

function ArGame({
  lang,
  t,
  play,
  buzz,
  onError,
  onReady,
  onEnd,
  ended,
  loading,
  onAgain,
  onExit,
  exitLabel,
}: {
  lang: 'en' | 'fr'
  t: T
  play: ReturnType<typeof useSettings>['play']
  buzz: ReturnType<typeof useSettings>['buzz']
  onError: () => void
  onReady: () => void
  onEnd: () => void
  ended: boolean
  loading: boolean
  onAgain: () => void
  onExit: () => void
  exitLabel: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const stage = useRef<ArStage | null>(null)
  const [tracking, setTracking] = useState(false)
  const [pick, setPick] = useState<ArItem | null>(null)
  const [wrong, setWrong] = useState<string | null>(null)
  const [done, setDone] = useState<string[]>([])
  const [recycled, setRecycled] = useState(0)
  const [toast, setToast] = useState<Toast | null>(null)
  const [left, setLeft] = useState(AR_CHALLENGE.seconds * 1000)
  const [started, setStarted] = useState(false)
  const endAt = useRef(0)

  const handlers = useRef({ onError, onReady, onEnd, play })
  useEffect(() => {
    handlers.current = { onError, onReady, onEnd, play }
  })

  const choices = useMemo(() => (pick ? shuffle(pick.choices) : []), [pick])

  useEffect(() => {
    const el = box.current
    if (!el) return
    const s = new ArStage(el, AR_CHALLENGE, {
      onTracking: (found) => {
        setTracking(found)
        if (found && !endAt.current) {
          endAt.current = performance.now() + AR_CHALLENGE.seconds * 1000
          setStarted(true)
        }
      },
      onPick: (id) => {
        const item = AR_CHALLENGE.items.find((i) => i.id === id) ?? null
        setPick(item)
        setWrong(null)
        s.select(id)
      },
    })
    stage.current = s
    s.start()
      .then(() => handlers.current.onReady())
      .catch(() => handlers.current.onError())
    return () => {
      s.stop()
      stage.current = null
    }
  }, [])

  useEffect(() => {
    if (!started || ended) return
    const id = window.setInterval(() => setLeft(Math.max(0, endAt.current - performance.now())), 200)
    return () => window.clearInterval(id)
  }, [started, ended])

  const won = recycled === RECYCLABLE_COUNT
  const over = started && (won || left <= 0)
  useEffect(() => {
    if (!over || ended) return
    stage.current?.select(null)
    handlers.current.play(won ? 'win' : 'wrong')
    const id = window.setTimeout(() => handlers.current.onEnd(), won ? 1400 : 300)
    return () => window.clearTimeout(id)
  }, [over, won, ended])

  const say = useCallback((text: string, tone: Toast['tone']) => setToast({ key: performance.now(), text, tone }), [])

  const answer = (word: string) => {
    if (!pick || !stage.current) return
    if (word !== pick.word) {
      setWrong(word)
      buzz([60, 40, 60])
      play('wrong')
      void stage.current.shake(pick.id)
      return
    }
    const item = pick
    setPick(null)
    setDone((d) => [...d, item.id])
    if (item.recyclable) {
      play('right')
      buzz([20, 60, 30])
      say(`${t('ar.recycled')} ${item.word}`, 'good')
      void stage.current.recycle(item.id).then(() => setRecycled((n) => n + 1))
    } else {
      play('malus')
      buzz([80, 40, 80])
      endAt.current -= AR_CHALLENGE.penalty * 1000
      say(item.fact?.[lang] ?? item.word, 'bad')
      void stage.current.reject(item.id)
    }
  }

  const close = () => {
    setPick(null)
    stage.current?.select(null)
  }

  const ratio = left / (AR_CHALLENGE.seconds * 1000)
  const late = left <= 10_000
  const elapsed = AR_CHALLENGE.seconds * 1000 - left
  const status = !tracking ? t('ar.scan') : elapsed > AR_CHALLENGE.hintAfter * 1000 && done.length < AR_CHALLENGE.items.length ? t('ar.hint') : t('ar.tap')

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-[#1b1410] select-none">
      <div ref={box} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/45 to-transparent px-4 pt-[max(12px,env(safe-area-inset-top))] pb-10">
        <div className="pointer-events-auto mx-auto flex max-w-[520px] items-center gap-3">
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onExit}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/90 text-[#777] shadow-[0_3px_0_rgba(0,0,0,.25)] active:translate-y-[3px] [&>svg]:size-5"
          >
            <CloseIcon />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5" role="timer">
            <ClockIcon className="size-6 shrink-0 text-white" />
            <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-200 ease-linear"
                style={{ width: `${ratio * 100}%`, background: late ? '#FF4B4B' : '#FFC800' }}
              >
                <div className="absolute top-1 right-2 left-2 h-[3px] rounded-full bg-white/50" />
              </div>
            </div>
            <span className="font-display w-11 text-right text-[16px] text-white tabular-nums">{formatClock(left)}</span>
          </div>
          <div className="font-display flex items-center gap-1.5 rounded-full bg-[#FFC800] px-3 py-1.5 text-[15px] text-[#6B4E00] shadow-[0_3px_0_#E0A800]">
            <img src="/ar/recycle.svg" alt="" className="size-5" />
            {t('ar.found', { n: recycled, total: RECYCLABLE_COUNT })}
          </div>
        </div>
      </div>

      {!over && !pick && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-[max(20px,env(safe-area-inset-bottom))]">
          {toast && (
            <p
              key={toast.key}
              className={`anim-rise mx-auto mb-3 w-fit max-w-[440px] rounded-2xl px-4 py-2.5 text-center text-[16px] leading-snug font-extrabold text-white ${toast.tone === 'good' ? 'bg-[#58CC02] shadow-[0_4px_0_#58A700]' : 'bg-[#FF4B4B] shadow-[0_4px_0_#EA2B2B]'}`}
            >
              {toast.text}
              {toast.tone === 'bad' && <span className="ml-2 opacity-80">{t('ar.penalty', { n: AR_CHALLENGE.penalty })}</span>}
            </p>
          )}
          <div className="mx-auto flex w-fit max-w-[440px] items-center gap-2.5 rounded-full bg-white/92 px-4 py-2.5 text-[15px] text-[#4B4B4B] shadow-[0_4px_0_rgba(0,0,0,.2)]">
            {!tracking && !loading && <span className="ar-scan size-5 shrink-0" aria-hidden="true" />}
            {loading ? t('ar.loading') : status}
          </div>
        </div>
      )}

      {pick && !over && (
        <div className="anim-sheet absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(0,0,0,.25)]">
          <div className="mx-auto max-w-[480px]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-ink text-[22px]">{t('ar.what')}</h2>
              <button type="button" aria-label={t('common.close')} onClick={close} className="text-faint grid size-9 place-items-center [&>svg]:size-5">
                <CloseIcon />
              </button>
            </div>
            <p className={`mt-0.5 min-h-5 text-[14px] ${wrong ? 'text-red' : 'text-sub'}`}>{wrong ? t('ar.tryAgain') : ' '}</p>
            <div className="mt-2 grid gap-2.5">
              {choices.map((word, i) => (
                <Btn
                  key={word}
                  color={wrong === word ? 'red' : 'white'}
                  className={`stagger w-full justify-start normal-case! ${wrong === word ? 'shake-x' : ''}`}
                  style={{ ['--i' as string]: i }}
                  onClick={() => answer(word)}
                >
                  {word}
                </Btn>
              ))}
            </div>
          </div>
        </div>
      )}

      {ended && (
        <div className="absolute inset-0 grid place-items-center bg-black/40 px-4">
          <section className="tile anim-pop w-full max-w-[380px] p-6 text-center">
            <div className={`mx-auto grid size-16 place-items-center rounded-full ${won ? 'bg-[#FFC800]' : 'bg-[#FFDFE0]'}`}>
              {won ? <StarIcon className="size-9 text-white" /> : <ClockIcon className="text-red size-8" />}
            </div>
            <h2 className="font-display text-ink mt-3 text-[26px] leading-tight">{won ? t('ar.winTitle') : t('ar.loseTitle')}</h2>
            <p className="text-sub mt-1.5 text-[16px] leading-snug">
              {won ? t('ar.winText', { n: POINTS.challenge }) : t('ar.loseText', { n: recycled, total: RECYCLABLE_COUNT })}
            </p>
            <Btn color="green" className="mt-5 w-full" onClick={onExit}>
              {exitLabel}
            </Btn>
            <Btn color="white" className="mt-3 w-full" onClick={onAgain}>
              {t('ar.again')}
            </Btn>
          </section>
        </div>
      )}
    </div>
  )
}
