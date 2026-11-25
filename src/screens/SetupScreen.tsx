import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton, Btn, Page, Progress, Stepper, TopBar } from '../components/ui'
import { PeopleIcon, PersonIcon } from '../components/icons'
import { CardFrame } from '../components/TeamCard'
import { loadDraft, saveDraft, type Draft } from '../game/draft'
import { MAX_STUDENTS, MIN_STUDENTS, TEAM_IDS } from '../game/rules'
import type { AnimalId, Mode, TeamId } from '../game/types'
import { TEAM_COLOR } from '../theme/colors'
import { AnimalButton, AnimalPicker } from './setup/AnimalPicker'
import { CARD_PALETTE } from '../theme/colors'
import { useSettings } from '../settings/useSettings'

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon,
  avatar,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  icon?: ReactNode
  avatar?: ReactNode
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 shadow-[inset_0_0_0_2px_#ececec,0_3px_0_#ececec] focus-within:shadow-[inset_0_0_0_2px_#84D8FF,0_3px_0_#84D8FF]">
      {avatar}
      <span className="min-w-0 flex-1">
        <span className="kicker text-sub block text-[10.5px]">{label}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={24}
          className="text-ink placeholder:text-faint w-full bg-transparent text-[17px] outline-none"
        />
      </span>
      <span className="text-[#cfcfcf] [&>svg]:size-5">{icon}</span>
    </label>
  )
}

function Framed({ team, label, children }: { team: TeamId; label: string; children: ReactNode }) {
  const p = CARD_PALETTE[team]
  return (
    <section className="anim-rise relative px-[5.5%] pt-9 pb-4">
      <CardFrame team={team} />
      <span
        className="font-display absolute top-2 left-[6%] rounded-full px-3 py-0.5 text-[12px] text-white uppercase"
        style={{ background: p.pill, boxShadow: `inset 0 0 0 1px ${p.pillLine}` }}
      >
        {label}
      </span>
      <div className="relative flex flex-col gap-2.5">{children}</div>
    </section>
  )
}

export function SetupScreen() {
  const { t } = useSettings()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<Draft>(() =>
    loadDraft({
      mode: 'teams',
      teams: {
        teams: {
          red: { name: t('setup.defaultRed'), players: ['', ''], animals: ['fox', 'frog'], students: 2 },
          blue: { name: t('setup.defaultBlue'), players: ['', ''], animals: ['goat', 'koala'], students: 2 },
        },
        class: {
          red: { name: t('setup.defaultRedGroup'), players: [], animals: ['fox'], students: 13 },
          blue: { name: t('setup.defaultBlueGroup'), players: [], animals: ['koala'], students: 12 },
        },
      },
    }),
  )
  const mode = draft.mode
  const teams = draft.teams[mode]
  const update = (team: TeamId, patch: Partial<Draft['teams'][Mode][TeamId]>) =>
    setDraft((d) => ({ ...d, teams: { ...d.teams, [d.mode]: { ...d.teams[d.mode], [team]: { ...d.teams[d.mode][team], ...patch } } } }))
  const setPlayer = (team: TeamId, i: number, name: string) => update(team, { players: teams[team].players.map((p, j) => (j === i ? name : p)) })

  const [picking, setPicking] = useState<{ team: TeamId; i: number } | null>(null)
  const slots = TEAM_IDS.flatMap((team) => teams[team].animals.map((animal, i) => ({ team, i, animal })))
  const choose = (animal: AnimalId) => {
    if (!picking) return
    const mine = teams[picking.team].animals[picking.i]
    const other = slots.find((s) => s.animal === animal && !(s.team === picking.team && s.i === picking.i))
    setDraft((d) => {
      const current = d.teams[d.mode]
      const nextTeams = { ...current }
      const put = (team: TeamId, i: number, value: AnimalId) => {
        nextTeams[team] = { ...nextTeams[team], animals: nextTeams[team].animals.map((a, j) => (j === i ? value : a)) }
      }
      put(picking.team, picking.i, animal)
      if (other) put(other.team, other.i, mine)
      return { ...d, teams: { ...d.teams, [d.mode]: nextTeams } }
    })
    setPicking(null)
  }
  const slotName = (team: TeamId, i: number) => (mode === 'class' ? t(`group.${team}`) : teams[team].players[i]?.trim() || t('setup.player', { n: i + 1 }))

  const next = () => {
    saveDraft(draft)
    navigate('/starts')
  }

  return (
    <Page>
      <TopBar left={<BackButton to="/" />} center={<Progress value={0.55} color="#58CC02" lip="#58A700" className="w-full" />} />
      <h1 className="font-display text-ink mt-5 text-[28px] leading-none">{t('setup.title')}</h1>
      <p className="text-sub mt-2 text-[15px]">{mode === 'class' ? t('setup.subtitleClass') : t('setup.subtitleTeams')}</p>

      <div role="radiogroup" className="bg-mist mt-4 grid grid-cols-2 gap-1 rounded-2xl p-1 shadow-[inset_0_0_0_2px_#eee]">
        {(['teams', 'class'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setDraft((d) => ({ ...d, mode: m }))}
            className={`font-display flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] uppercase transition ${mode === m ? 'text-blue bg-white shadow-[0_2px_0_#e5e5e5]' : 'text-faint'}`}
          >
            {m === 'teams' ? <PersonIcon className="size-4" /> : <PeopleIcon className="size-4" />}
            {t(m === 'teams' ? 'setup.modeTeams' : 'setup.modeClass')}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-4 pb-4">
        {TEAM_IDS.map((team) => {
          const color = CARD_PALETTE[team].ring
          return (
            <Framed key={`${mode}-${team}`} team={team} label={t(mode === 'class' ? `group.${team}` : `team.${team}`)}>
              <Field
                label={t(mode === 'class' ? 'setup.groupName' : 'setup.teamName')}
                value={teams[team].name}
                onChange={(name) => update(team, { name })}
                placeholder={t(`team.${team}`)}
                icon={<PeopleIcon />}
              />
              {mode === 'teams' ? (
                [0, 1].map((i) => (
                  <Field
                    key={i}
                    label={t('setup.player', { n: i + 1 })}
                    value={teams[team].players[i] ?? ''}
                    onChange={(v) => setPlayer(team, i, v)}
                    placeholder={t('setup.player', { n: i + 1 })}
                    icon={<PersonIcon />}
                    avatar={
                      <AnimalButton
                        animal={teams[team].animals[i]}
                        ring={color}
                        label={t('setup.chooseFor', { name: slotName(team, i) })}
                        onClick={() => setPicking({ team, i })}
                      />
                    }
                  />
                ))
              ) : (
                <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[inset_0_0_0_2px_#ececec,0_3px_0_#ececec]">
                  <AnimalButton
                    animal={teams[team].animals[0]}
                    ring={color}
                    label={t('setup.chooseFor', { name: slotName(team, 0) })}
                    onClick={() => setPicking({ team, i: 0 })}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="kicker text-sub block text-[10.5px]">{t('setup.onePawn')}</span>
                    <span className="text-ink block text-[17px]">{t('setup.students', { n: teams[team].students })}</span>
                  </span>
                  <Stepper
                    label={t('setup.onePawn')}
                    value=""
                    onMinus={() => update(team, { students: Math.max(MIN_STUDENTS, teams[team].students - 1) })}
                    onPlus={() => update(team, { students: Math.min(MAX_STUDENTS, teams[team].students + 1) })}
                  />
                </div>
              )}
            </Framed>
          )
        })}
        {mode === 'class' && (
          <p className="anim-rise bg-yellow-soft rounded-2xl px-4 py-3 text-[14px] leading-snug text-[#9A6B00] shadow-[inset_0_0_0_2px_#FFE58A,0_3px_0_#FFE58A]">
            {t('setup.classNote')}
          </p>
        )}
      </div>

      <div className="from-paper via-paper/95 to-paper/0 sticky bottom-0 -mx-4 mt-auto bg-gradient-to-t px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
        <Btn shine className="w-full" onClick={next}>
          {t('common.continue')}
        </Btn>
      </div>
      {picking && (
        <AnimalPicker
          title={t('setup.chooseTitle', { name: slotName(picking.team, picking.i) })}
          current={teams[picking.team].animals[picking.i]}
          owners={Object.fromEntries(
            slots
              .filter((s) => !(s.team === picking.team && s.i === picking.i))
              .map((s) => [s.animal, { name: slotName(s.team, s.i), color: TEAM_COLOR[s.team].l }]),
          )}
          onPick={choose}
          onClose={() => setPicking(null)}
        />
      )}
    </Page>
  )
}
