import { useEffect, useRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { SEASON_COLOR, TEAM_COLOR } from '../theme/colors'
import { initial } from '../lib/format'
import { AnimalFace } from './animals/AnimalFace'
import type { AnimalId, Season, TeamId } from '../game/types'
import { BackIcon, PauseIcon } from './icons'
import { useSettings } from '../settings/useSettings'
import { useGame } from '../game/useGame'

export type BtnColor = 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'white'

export function Btn({
  color = 'green',
  size,
  shine,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { color?: BtnColor; size?: 'sm'; shine?: boolean }) {
  return <button type="button" className={`btn btn-${color} ${size === 'sm' ? 'btn-sm' : ''} ${shine ? 'btn-shine' : ''} ${className}`} {...props} />
}

export function IconBtn({ label, children, onClick, className = '' }: { label: string; children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`text-faint grid size-10 shrink-0 place-items-center rounded-xl bg-white shadow-[inset_0_0_0_2px_#e5e5e5,0_3px_0_#e5e5e5] transition active:translate-y-[3px] active:shadow-[inset_0_0_0_2px_#e5e5e5] [&>svg]:size-5 ${className}`}
    >
      {children}
    </button>
  )
}

export function Pill({
  color,
  lip,
  children,
  className = '',
  style,
}: {
  color: string
  lip?: string
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <span
      className={`gloss font-display inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] tracking-[0.06em] text-white uppercase ${className}`}
      style={{ backgroundColor: color, boxShadow: lip ? `0 2px 0 ${lip}` : undefined, ...style }}
    >
      {children}
    </span>
  )
}

export function SeasonPill({ season, children }: { season: Season; children: ReactNode }) {
  const c = SEASON_COLOR[season]
  return (
    <Pill color={c.f} lip={c.l} className="px-4 py-1.5 text-[12px]">
      {children}
    </Pill>
  )
}

function FlagEn() {
  return (
    <svg viewBox="0 0 60 40" className="block size-full">
      <rect width="60" height="40" fill="#2B4C9B" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#fff" strokeWidth="9" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#D84B4B" strokeWidth="3.5" />
      <path d="M30 0V40M0 20H60" stroke="#fff" strokeWidth="13" />
      <path d="M30 0V40M0 20H60" stroke="#D84B4B" strokeWidth="7" />
    </svg>
  )
}

function FlagFr() {
  return (
    <svg viewBox="0 0 60 40" className="block size-full">
      <rect width="20" height="40" fill="#2B4C9B" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#D84B4B" />
    </svg>
  )
}

export function Flags() {
  const { settings, update } = useSettings()
  return (
    <div className="flex shrink-0 gap-1.5" role="radiogroup" aria-label="Language">
      {(['en', 'fr'] as const).map((lang) => {
        const on = settings.language === lang
        return (
          <button
            key={lang}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={lang === 'en' ? 'English' : 'Français'}
            onClick={() => update({ language: lang })}
            className={`h-[26px] w-[34px] overflow-hidden rounded-lg transition ${on ? '-translate-y-px opacity-100 shadow-[0_0_0_2.5px_#1CB0F6,0_3px_0_#1899D6]' : 'opacity-55 shadow-[0_0_0_2px_#E5E5E5,0_3px_0_#E5E5E5]'}`}
          >
            {lang === 'en' ? <FlagEn /> : <FlagFr />}
          </button>
        )
      })}
    </div>
  )
}

export function TopBar({ left, center, right }: { left?: ReactNode; center?: ReactNode; right?: ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-12 items-center gap-3">
      {left}
      <div className="flex min-w-0 flex-1 justify-center">{center}</div>
      {right}
    </div>
  )
}

export function BackButton({ to }: { to?: string }) {
  const navigate = useNavigate()
  const { t } = useSettings()
  return (
    <IconBtn label={t('common.back')} onClick={() => (to ? navigate(to) : navigate(-1))}>
      <BackIcon />
    </IconBtn>
  )
}

export function PauseButton() {
  const navigate = useNavigate()
  const { t } = useSettings()
  const { pause } = useGame()
  const open = () => {
    pause()
    navigate('/pause')
  }
  return (
    <IconBtn label={t('game.pause')} onClick={open}>
      <PauseIcon />
    </IconBtn>
  )
}

export function Scene({ season, strong }: { season?: Season | null; strong?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const move = (e: PointerEvent) => el.style.setProperty('--px', `${(0.5 - e.clientX / window.innerWidth) * 14}px`)
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  return (
    <div ref={ref} className="bg-paper pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {season && (
        <div
          key={season}
          className="absolute -inset-4 bg-cover bg-[center_62%]"
          style={{
            backgroundImage: `url(/decors/${season}.webp)`,
            translate: 'var(--px, 0) 0',
            transition: 'translate .5s ease-out',
            animation: 'fade-in .8s ease both',
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: strong
            ? 'linear-gradient(180deg,rgba(255,253,249,.92) 0%,rgba(255,253,249,.72) 22%,rgba(255,253,249,.6) 100%)'
            : 'linear-gradient(180deg,rgba(255,250,240,.86) 0%,rgba(255,250,240,.65) 12%,rgba(255,250,240,0) 26%,rgba(255,250,240,0) 76%,rgba(255,250,240,.3) 100%)',
        }}
      />
    </div>
  )
}

export function Page({ children, aside, className = '' }: { children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className="flex min-h-full justify-center lg:gap-8 lg:px-8">
      {aside && <aside className="sticky top-0 hidden h-dvh min-w-0 flex-1 items-center py-6 lg:flex">{aside}</aside>}
      <main
        className={`relative flex min-h-dvh w-full max-w-[460px] flex-col px-4 pt-[max(12px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))] lg:shrink-0 ${className}`}
      >
        {children}
      </main>
    </div>
  )
}

export function BottomPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`sticky bottom-0 z-20 -mx-4 mt-auto rounded-t-[28px] bg-white px-4 pt-5 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(40,60,40,.08)] ${className}`}
    >
      {children}
    </div>
  )
}

export function Avatar({
  name,
  team,
  animal,
  size = 28,
  ring,
  className = '',
}: {
  name: string
  team: TeamId
  animal?: AnimalId
  size?: number
  ring?: boolean
  className?: string
}) {
  const c = TEAM_COLOR[team]
  if (animal)
    return (
      <span
        className={`relative inline-block shrink-0 rounded-full ${className}`}
        style={{
          boxShadow: ring
            ? `0 0 0 ${size * 0.08}px ${c.f}, 0 0 0 ${size * 0.16}px #fff, 0 0 0 ${size * 0.24}px #FFC800`
            : `0 0 0 ${Math.max(2, size * 0.08)}px ${c.f}`,
        }}
        aria-hidden="true"
      >
        <AnimalFace animal={animal} size={size} />
      </span>
    )
  return (
    <span
      className={`font-display relative inline-grid shrink-0 place-items-center rounded-full text-white ${className}`}
      style={{
        width: size,
        height: size,
        background: c.f,
        fontSize: size * 0.42,
        boxShadow: ring ? `0 0 0 ${size * 0.1}px #fff, 0 0 0 ${size * 0.2}px #FFC800` : `0 0 0 ${Math.max(2, size * 0.08)}px #fff`,
      }}
      aria-hidden="true"
    >
      <span className="absolute top-[18%] left-[22%] size-[22%] rounded-full bg-white/35" />
      {initial(name)}
    </span>
  )
}

export function Stepper({ value, onMinus, onPlus, label }: { value: ReactNode; onMinus: () => void; onPlus: () => void; label: string }) {
  const btn =
    'grid size-9 place-items-center rounded-xl bg-white text-xl text-sub shadow-[inset_0_0_0_2px_#e5e5e5,0_3px_0_#e5e5e5] active:translate-y-[3px] active:shadow-[inset_0_0_0_2px_#e5e5e5]'
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn} onClick={onMinus} aria-label={`${label} −`}>
        −
      </button>
      {value !== '' && <span className="font-display min-w-12 text-center text-lg tabular-nums">{value}</span>}
      <button type="button" className={btn} onClick={onPlus} aria-label={`${label} +`}>
        +
      </button>
    </div>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors ${on ? 'bg-green shadow-[inset_0_-3px_0_#58A700]' : 'bg-line shadow-[inset_0_-3px_0_#d0d0d0]'}`}
    >
      <span
        className={`absolute top-1 size-6 rounded-full bg-white shadow-[0_2px_0_rgba(0,0,0,.12)] transition-all duration-200 ${on ? 'left-[24px]' : 'left-1'}`}
      />
    </button>
  )
}

export function Sheet({ tone, children }: { tone: 'good' | 'bad' | 'malus' | 'plain'; children: ReactNode }) {
  const bg = { good: '#D7FFB8', bad: '#FFDFE0', malus: '#F6E6FF', plain: '#FFFFFF' }[tone]
  return (
    <div className="anim-sheet sticky bottom-0 z-30 -mx-4 mt-auto px-4 pt-5 pb-[max(16px,env(safe-area-inset-bottom))]" style={{ background: bg }}>
      {children}
    </div>
  )
}

export function ConfirmDialog({
  open,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end justify-center bg-[#22202A]/30 p-4 sm:items-center" onClick={onCancel}>
      <div className="anim-rise w-full max-w-sm rounded-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <p className="mb-5 text-[17px] leading-snug">{message}</p>
        <div className="flex gap-3">
          <Btn color="white" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Btn>
          <Btn color="red" className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Btn>
        </div>
      </div>
    </div>
  )
}

export function Bubble({ children, side = 'left', className = '' }: { children: ReactNode; side?: 'left' | 'bottom'; className?: string }) {
  return (
    <div
      className={`text-ink relative rounded-[20px] bg-white px-4 py-3 text-[17px] leading-snug shadow-[inset_0_0_0_2px_#e5e5e5,0_4px_0_#e5e5e5] ${className}`}
    >
      {children}
      {side === 'left' ? (
        <svg className="absolute top-1/2 -left-[11px] -translate-y-1/2" width="14" height="22" viewBox="0 0 14 22" aria-hidden="true">
          <path d="M14 1 L2 11 L14 21Z" fill="#fff" />
          <path d="M13 1 L2 11 L13 21" fill="none" stroke="#e5e5e5" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="absolute -bottom-[11px] left-8" width="22" height="14" viewBox="0 0 22 14" aria-hidden="true">
          <path d="M1 0 L11 12 L21 0Z" fill="#fff" />
        </svg>
      )}
    </div>
  )
}

export function Progress({
  value,
  color,
  lip,
  height = 16,
  className = '',
}: {
  value: number
  color: string
  lip?: string
  height?: number
  className?: string
}) {
  return (
    <div className={`bg-line relative overflow-hidden rounded-full ${className}`} style={{ height }}>
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
        style={{
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          background: color,
          transitionTimingFunction: 'cubic-bezier(.3,1.3,.5,1)',
          boxShadow: lip ? `inset 0 -2px 0 ${lip}` : undefined,
        }}
      >
        <div className="absolute top-[25%] right-2 left-2 h-[22%] rounded-full bg-white/50" />
      </div>
    </div>
  )
}
