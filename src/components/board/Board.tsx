import { Component, lazy, Suspense, useState, type ReactNode } from 'react'
import { SQUARES } from '../../data/board'
import { squareOf } from '../../game/rules'
import type { EggStage, TeamId } from '../../game/types'
import type { BoardPawn } from './types'

const Board3D = lazy(() => import('./Board3D'))

const TEAM_HEX: Record<TeamId, string> = { red: '#FF4B4B', blue: '#1CB0F6' }

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

class Guard extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function Board2D({ pawns, className = '' }: { pawns: BoardPawn[]; className?: string }) {
  return (
    <div className={className.includes('absolute') ? `grid place-items-center ${className}` : `relative ${className}`} style={{ perspective: 1200 }}>
      <div className="relative aspect-[848/600] w-full" style={{ transform: 'rotateX(28deg)', transformOrigin: '50% 70%' }}>
        <img src="/board/board.svg" alt="" className="absolute inset-0 size-full rounded-[4%] shadow-[0_18px_30px_rgba(60,40,20,.25)]" />
        {pawns.map((p, i) => {
          const s = SQUARES[squareOf(p.distance)]
          const same = pawns.filter((q) => squareOf(q.distance) === squareOf(p.distance))
          const k = same.indexOf(p)
          const dx = same.length > 1 ? (k - (same.length - 1) / 2) * 2.2 : 0
          return (
            <span
              key={p.id}
              className="font-display absolute grid size-[5%] min-h-5 min-w-5 -translate-x-1/2 -translate-y-[80%] place-items-center rounded-full text-[10px] text-white transition-all duration-500"
              style={{
                left: `${s.x * 100 + dx}%`,
                top: `${s.y * 100}%`,
                background: TEAM_HEX[p.team],
                boxShadow: p.active ? '0 0 0 2px #fff, 0 0 0 4px #FFC800, 0 6px 8px rgba(0,0,0,.25)' : '0 0 0 2px #fff, 0 6px 8px rgba(0,0,0,.25)',
                zIndex: 10 + i,
              }}
            >
              {p.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function Board({
  pawns,
  eggs,
  focus,
  onArrive,
  className = '',
}: {
  pawns: BoardPawn[]
  eggs: Record<TeamId, EggStage>
  focus?: string | null
  onArrive?: () => void
  className?: string
}) {
  const [webgl] = useState(hasWebGL)
  const flat = <Board2D pawns={pawns} className={className} />
  if (!webgl) return flat
  return (
    <Guard fallback={flat}>
      <Suspense
        fallback={
          <div className={`grid place-items-center ${className}`}>
            <span className="border-line border-t-green size-10 animate-spin rounded-full border-4" />
          </div>
        }
      >
        <Board3D pawns={pawns} eggs={eggs} focus={focus} onArrive={onArrive} className={className} />
      </Suspense>
    </Guard>
  )
}
