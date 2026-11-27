import { AnimalArt } from '../../components/animals/Animal'
import { AnimalFace } from '../../components/animals/AnimalFace'
import { ANIMALS } from '../../game/rules'
import type { AnimalId } from '../../game/types'
import { useSettings } from '../../settings/useSettings'

export function AnimalButton({ animal, ring, label, onClick }: { animal: AnimalId; ring: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}
      aria-label={label}
      className="relative shrink-0 rounded-full transition-transform active:scale-90"
    >
      <span className="block rounded-full" style={{ boxShadow: `0 0 0 2.5px ${ring}, 0 0 0 5px #fff` }}>
        <AnimalFace animal={animal} size={38} />
      </span>
      <span className="font-display absolute -right-1 -bottom-1 grid size-[18px] place-items-center rounded-full bg-white text-[11px] text-[#AFAFAF] shadow-[0_0_0_2px_#ececec]">
        ⇄
      </span>
    </button>
  )
}

export function AnimalPicker({
  title,
  current,
  owners,
  onPick,
  onClose,
}: {
  title: string
  current: AnimalId
  owners: Partial<Record<AnimalId, { name: string; color: string }>>
  onPick: (animal: AnimalId) => void
  onClose: () => void
}) {
  const { t } = useSettings()
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#22202A]/30 sm:items-center"
      onClick={onClose}
    >
      <div
        className="anim-sheet w-full max-w-[460px] rounded-t-[30px] bg-white px-4 pt-3 pb-[max(18px,env(safe-area-inset-bottom))] sm:rounded-[30px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-line mx-auto mb-3 h-1.5 w-12 rounded-full" />
        <h2 className="font-display text-ink text-center text-[22px] leading-tight">{title}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {ANIMALS.map((animal, n) => {
            const selected = animal === current
            const owner = owners[animal]
            return (
              <button
                key={animal}
                type="button"
                aria-pressed={selected}
                onClick={() => onPick(animal)}
                className={`stagger relative flex flex-col items-center rounded-[22px] px-2 pt-2 pb-3 transition-transform active:scale-95 ${selected ? 'bg-[#DDF4FF] shadow-[inset_0_0_0_3px_#84D8FF,0_4px_0_#84D8FF]' : 'bg-white shadow-[inset_0_0_0_2px_#ececec,0_4px_0_#ececec]'}`}
                style={{ ['--i' as string]: n }}
              >
                <AnimalArt animal={animal} cue={selected ? 'hello' : undefined} cueKey={animal} className="w-[78%]" />
                <span className="font-display text-ink mt-1 text-[16px]">{t(`animalName.${animal}`)}</span>
                <span className="h-4 text-[12px] font-bold" style={{ color: owner?.color }}>
                  {owner ? t('setup.swapWith', { name: owner.name }) : ''}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
