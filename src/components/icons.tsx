import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

function icon(name: string) {
  return function Icon(p: P) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
        <use href={`/icons/${name}.svg#i`} />
      </svg>
    )
  }
}

export const PauseIcon = icon('pause')
export const BackIcon = icon('back')
export const CloseIcon = icon('close')
export const CheckIcon = icon('check')
export const GearIcon = icon('gear')
export const DiceIcon = icon('dice')
export const BookIcon = icon('book')
export const ClockIcon = icon('clock')
export const StarIcon = icon('star')
export const BoltIcon = icon('bolt')
export const BagIcon = icon('bag')
export const PeopleIcon = icon('people')
export const PersonIcon = icon('person')
export const PlayIcon = icon('play')
export const ChevronIcon = icon('chevron')
export const MapIcon = icon('map')
export const UndoIcon = icon('undo')
export const QrIcon = icon('qr')
export const ReplayIcon = icon('replay')
export const SlowIcon = icon('slow')
