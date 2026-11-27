import { useMemo, type CSSProperties } from 'react'

const STAR = 'polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)'
const LEAF = 'ellipse(50% 28% at 50% 50%)'

export function Burst({ colors, count = 14, className = '' }: { colors: string[]; count?: number; className?: string }) {
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1)
        const dist = 46 + (i % 3) * 18
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 10,
          r: (i * 47) % 360,
          size: 9 + (i % 4) * 3,
          color: colors[i % colors.length],
          shape: i % 3 === 0 ? LEAF : STAR,
          delay: (i % 5) * 18,
        }
      }),
    [colors, count],
  )
  return (
    <span className={`pointer-events-none absolute inset-0 grid place-items-center ${className}`} aria-hidden="true">
      {parts.map((p, i) => (
        <i
          key={i}
          className="burst-bit absolute"
          style={
            {
              width: p.size,
              height: p.size,
              background: p.color,
              clipPath: p.shape,
              '--x': `${p.x}px`,
              '--y': `${p.y}px`,
              '--r': `${p.r}deg`,
              animationDelay: `${p.delay}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  )
}
