import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Animal } from '../components/animals/Animal'
import { BackButton, Btn, Flags, Page, Scene, TopBar } from '../components/ui'
import type { AnimalId, Season } from '../game/types'
import { type MessageKey, useSettings } from '../settings/useSettings'

const PAGES: { title: MessageKey; body: MessageKey; animal: AnimalId; season: Season }[] = [
  { title: 'rules.p1t', body: 'rules.p1', animal: 'frog', season: 'spring' },
  { title: 'rules.p2t', body: 'rules.p2', animal: 'goat', season: 'summer' },
  { title: 'rules.p3t', body: 'rules.p3', animal: 'fox', season: 'autumn' },
  { title: 'rules.p4t', body: 'rules.p4', animal: 'koala', season: 'winter' },
  { title: 'rules.p5t', body: 'rules.p5', animal: 'frog', season: 'spring' },
  { title: 'rules.p6t', body: 'rules.p6', animal: 'koala', season: 'spring' },
]

export function RulesScreen() {
  const { t } = useSettings()
  const navigate = useNavigate()
  const [i, setI] = useState(0)
  const page = PAGES[i]
  const last = i === PAGES.length - 1

  return (
    <Page>
      <Scene season={page.season} />
      <TopBar left={<BackButton />} right={<Flags />} />
      <div className="mt-3 flex justify-center gap-2" aria-hidden="true">
        {PAGES.map((p, n) => (
          <span key={p.title} className={`h-2.5 rounded-full transition-all duration-300 ${n === i ? 'bg-green w-7' : 'w-2.5 bg-white/80'}`} />
        ))}
      </div>
      <div key={i} className="mt-4 flex flex-1 flex-col items-center" style={{ animation: 'rise-in .45s cubic-bezier(.3,1.4,.5,1) both' }}>
        <Animal animal={page.animal} cue="hello" cueKey={`rules-${i}`} className="w-[46%] max-w-[190px]" />
        <section className="tile mt-2 w-full p-5">
          <div className="kicker text-green">{`${i + 1} / ${PAGES.length}`}</div>
          <h1 className="font-display text-ink mt-1 text-[26px] leading-tight">{t(page.title)}</h1>
          <p className="text-ink/80 mt-2 text-[16px] leading-relaxed">{t(page.body)}</p>
        </section>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_2fr] gap-3 pb-2">
        <Btn color="white" disabled={i === 0} onClick={() => setI(i - 1)}>
          {t('rules.prev')}
        </Btn>
        <Btn shine onClick={() => (last ? navigate(-1) : setI(i + 1))}>
          {last ? t('rules.done') : t('rules.next')}
        </Btn>
      </div>
    </Page>
  )
}
