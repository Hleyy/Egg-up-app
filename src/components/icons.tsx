import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

const base = { viewBox: '0 0 24 24', 'aria-hidden': true } as const

export function PauseIcon(p: P) {
  return (
    <svg {...base} fill="currentColor" {...p}>
      <rect x="6" y="5" width="4.5" height="14" rx="2" />
      <rect x="13.5" y="5" width="4.5" height="14" rx="2" />
    </svg>
  )
}

export function BackIcon(p: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

export function CloseIcon(p: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function CheckIcon(p: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function GearIcon(p: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8" />
    </svg>
  )
}

export function DiceIcon(p: P) {
  return (
    <svg {...base} fill="none" {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="8.6" cy="8.6" r="1.7" fill="currentColor" />
      <circle cx="15.4" cy="15.4" r="1.7" fill="currentColor" />
      <circle cx="15.4" cy="8.6" r="1.7" fill="currentColor" />
      <circle cx="8.6" cy="15.4" r="1.7" fill="currentColor" />
    </svg>
  )
}

export function BookIcon(p: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" {...p}>
      <path d="M3 6.5Q7.5 4.5 12 7q4.5-2.5 9-.5v12.5q-4.5-2-9 .5-4.5-2.5-9-.5Z" />
      <path d="M12 7v12.5" />
    </svg>
  )
}

export function ClockIcon(p: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function StarIcon(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3l-5.8 3.1 1.2-6.5-4.8-4.5 6.5-.8Z" fill="currentColor" />
    </svg>
  )
}

export function BoltIcon(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M13.6 2L5 13.4h6.2L9.6 22 19 9.8h-6.4Z" fill="currentColor" />
    </svg>
  )
}

export function BagIcon(p: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" {...p}>
      <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" strokeLinecap="round" />
    </svg>
  )
}

export function PeopleIcon(p: P) {
  return (
    <svg {...base} fill="currentColor" {...p}>
      <circle cx="8.5" cy="8" r="3.4" />
      <circle cx="16.5" cy="9" r="2.8" />
      <path d="M2.5 19c0-3.6 2.7-6 6-6s6 2.4 6 6Z" />
      <path d="M15.2 19c0-2-.6-3.7-1.7-4.9a5 5 0 0 1 8 4.9Z" />
    </svg>
  )
}

export function PersonIcon(p: P) {
  return (
    <svg {...base} fill="currentColor" {...p}>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M5 20c0-4 3.1-6.6 7-6.6s7 2.6 7 6.6Z" />
    </svg>
  )
}

export function PlayIcon(p: P) {
  return (
    <svg {...base} fill="currentColor" {...p}>
      <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.3-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5Z" />
    </svg>
  )
}

export function ChevronIcon(p: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function MapIcon(p: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" {...p}>
      <path d="M3 6.5l5.5-2.5 7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20Z" />
      <path d="M8.5 4v13.5M15.5 6.5V20" />
    </svg>
  )
}

export function SpeakerIcon(p: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="currentColor" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </svg>
  )
}

export function UndoIcon(p: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 7L4.5 11.5 9 16" />
      <path d="M5 11.5h9.5a5 5 0 0 1 0 10H11" />
    </svg>
  )
}

export function QrIcon(p: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" {...p}>
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.6" />
      <path d="M14 14h2.6v2.6H14zM18 18h2.5v2.5H18zM18 14h2.5M14 18v2.5" strokeLinecap="round" />
    </svg>
  )
}
