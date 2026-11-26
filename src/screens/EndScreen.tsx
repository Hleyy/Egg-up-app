import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTalk } from '../components/animals/useTalk'
import { Btn, Page } from '../components/ui'
import { useLabels } from '../game/useView'
import { en } from '../i18n/en'
import { TEAM_COLOR } from '../theme/colors'
import { useGame } from '../game/useGame'
import { useSettings } from '../settings/useSettings'

function CountUp({ to, delay }: { to: number; delay: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now() + delay
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / 700))
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, delay])
  return <>{n}</>
}

function Stat({ label, value, suffix = '', c, d, delay }: { label: string; value: number; suffix?: string; c: string; d: string; delay: number }) {
  return (
    <div
      className="gloss rounded-[18px] p-[3px] opacity-0"
      style={{ background: c, boxShadow: `0 4px 0 ${d}`, animation: `rise-in .5s cubic-bezier(.3,1.6,.5,1) ${delay}ms forwards` }}
    >
      <div className="kicker py-1.5 text-center text-[11px] text-white">{label}</div>
      <div className="font-display rounded-[15px] bg-white py-2.5 text-center text-[26px]" style={{ color: d }}>
        <CountUp to={value} delay={delay} />
        {suffix}
      </div>
    </div>
  )
}

export function EndScreen() {
  const { game, clearGame, elapsed } = useGame()
  const { t, play } = useSettings()
  const labels = useLabels()
  const navigate = useNavigate()
  const speech = useTalk()
  const [phase, setPhase] = useState<'cheer' | 'result'>('cheer')
  const winner = game?.winner ?? null
  const creature = winner && game ? game.teams[winner].creature : 'bloom'
  const say = speech.say
  const line = winner ? t('end.itsA', { animal: t(`creature.${creature}`) }) : ''

  useEffect(() => {
    const id = window.setTimeout(() => setPhase('result'), 1300)
    return () => window.clearTimeout(id)
  }, [])
  useEffect(() => {
    if (winner) play('win')
  }, [winner, play])
  useEffect(() => {
    if (!winner) return
    const id = window.setTimeout(() => say(`It's ${en.creature[creature]}, ${en.creatureAbout[creature]}!`), 600)
    return () => window.clearTimeout(id)
  }, [winner, say, creature])

  if (!game || game.status !== 'finished') return <Navigate to="/" replace />

  const team = winner ? game.teams[winner] : null
  const color = winner ? TEAM_COLOR[winner] : { f: '#AFAFAF', l: '#8F8F8F' }
  const minutes = Math.max(1, Math.round(elapsed / 60_000))
  const done = () => {
    clearGame()
    navigate('/', { replace: true })
  }

  return (
    <Page className="overflow-hidden">
      <div className="bg-paper pointer-events-none fixed inset-0 -z-10" />
      <div
        className="pointer-events-none absolute top-[24%] -right-1/4 -left-1/4 h-[30%] origin-left"
        style={{ background: color.f, animation: 'band-in .45s cubic-bezier(.7,0,.3,1) both', transform: 'rotate(-12deg)' }}
      />
      {[
        ['14%', '16%', '0s', 1],
        ['84%', '13%', '.3s', 0.8],
        ['8%', '44%', '.6s', 0.7],
        ['90%', '50%', '.15s', 0.9],
      ].map(([l, tp, dl, s]) => (
        <i
          key={`${l}${tp}`}
          className="bg-yellow pointer-events-none absolute size-5"
          style={{
            left: l as string,
            top: tp as string,
            clipPath: 'polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)',
            animation: `spark 1.6s ease-in-out ${dl} infinite`,
            ['--s' as string]: s,
          }}
        />
      ))}
      <div className="relative z-10 mt-[7vh] text-center">
        <div className="kicker text-[13px]" style={{ color: color.f }}>
          {winner ? t('end.wins', { team: labels.team(game, winner) }) : game.endReason === 'timeout' ? t('end.timeout') : t('end.abandoned')}
        </div>
        <h1
          className="font-display text-ink mt-2 text-[34px] leading-tight"
          style={{ transform: phase === 'cheer' ? 'scale(1.1)' : 'none', transition: 'transform .4s' }}
        >
          {winner ? line : t('end.timeoutDetail')}
        </h1>
        {winner && (
          <p className="font-display mx-auto mt-2 w-fit rounded-full bg-white px-4 py-1 text-[15px] shadow-[0_3px_0_#ececec]" style={{ color: color.l }}>
            {t(`creatureAbout.${creature}`)}
          </p>
        )}
      </div>
      {winner && (
        <div
          className="relative z-10 mx-auto mt-2 w-[64%] max-w-[260px] transition-transform duration-700"
          style={{ transform: phase === 'result' ? 'translateY(-6%) scale(.92)' : 'none', transitionTimingFunction: 'cubic-bezier(.3,1.2,.5,1)' }}
        >
          <div style={{ animation: 'rise-in 1s cubic-bezier(.25,1.5,.5,1) .35s both' }}>
            <div className={speech.talking ? 'creature is-talking' : 'creature'}>
              <img src={`/creatures/${creature}.svg`} alt={t(`creature.${creature}`)} className="w-full" draggable={false} />
            </div>
          </div>
          <img src={`/img/eggshell-${winner}.svg`} alt="" className="-mt-[18%] w-full" />
        </div>
      )}
      <div className={`relative z-10 mt-auto grid gap-3 pt-6 ${team ? 'grid-cols-2' : 'mx-auto w-1/2 grid-cols-1'}`}>
        {team && (
          <>
            <Stat label={t('end.points')} value={team.score} c="#FFC800" d="#E0A800" delay={1400} />
            <Stat label={t('end.right')} value={team.right} c="#58CC02" d="#58A700" delay={2100} />
            <Stat label={t('end.challenges')} value={team.challenges} c="#FF4B4B" d="#EA2B2B" delay={2800} />
          </>
        )}
        <Stat label={t('end.time')} value={minutes} suffix=" min" c="#1CB0F6" d="#1899D6" delay={team ? 3500 : 400} />
      </div>
      <Btn shine className="relative z-10 mt-5 w-full opacity-0" style={{ animation: `rise-in .4s ease ${team ? 3900 : 800}ms forwards` }} onClick={done}>
        {t('common.continue')}
      </Btn>
    </Page>
  )
}
