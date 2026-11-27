import qrcode from 'qrcode-generator'
import { useMemo } from 'react'

function isFinder(r: number, c: number, n: number): boolean {
  const inBox = (r0: number, c0: number) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7
  return inBox(0, 0) || inBox(0, n - 7) || inBox(n - 7, 0)
}

function Finder({ x, y, color, accent }: { x: number; y: number; color: string; accent: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M1.3 0h4.4A1.3 1.3 0 0 1 7 1.3v4.4A1.3 1.3 0 0 1 5.7 7H1.3A1.3 1.3 0 0 1 0 5.7V1.3A1.3 1.3 0 0 1 1.3 0ZM1.6 1h3.8a.6.6 0 0 1 .6.6v3.8a.6.6 0 0 1-.6.6H1.6a.6.6 0 0 1-.6-.6V1.6a.6.6 0 0 1 .6-.6Z"
        fill={color}
        fillRule="evenodd"
      />
      <rect x="2" y="2" width="3" height="3" rx="0.7" fill={accent} />
    </g>
  )
}

export function QrCode({
  value,
  color = '#3C3A45',
  accent = '#3C3A45',
  className = '',
}: {
  value: string
  color?: string
  accent?: string
  className?: string
}) {
  const { n, dots } = useMemo(() => {
    const qr = qrcode(0, 'Q')
    qr.addData(value)
    qr.make()
    const size = qr.getModuleCount()
    const list: [number, number][] = []
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (qr.isDark(r, c) && !isFinder(r, c, size)) list.push([r, c])
    return { n: size, dots: list }
  }, [value])

  return (
    <svg viewBox={`-3 -3 ${n + 6} ${n + 6}`} className={className} role="img" aria-label={value} shapeRendering="geometricPrecision">
      <rect x="-3" y="-3" width={n + 6} height={n + 6} rx="3" fill="#fff" />
      {dots.map(([r, c]) => (
        <rect key={`${r}-${c}`} x={c + 0.05} y={r + 0.05} width="0.9" height="0.9" rx="0.28" fill={color} />
      ))}
      <Finder x={0} y={0} color={color} accent={accent} />
      <Finder x={n - 7} y={0} color={color} accent={accent} />
      <Finder x={0} y={n - 7} color={color} accent={accent} />
    </svg>
  )
}
