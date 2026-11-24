import { useSettings } from '../settings/SettingsProvider'

export function LanguageToggle() {
  const { settings, update } = useSettings()
  return (
    <div className="flex rounded-ui bg-surface-muted p-0.5 text-xs font-bold" role="radiogroup" aria-label="Language">
      {(['en', 'fr'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          role="radio"
          aria-checked={settings.language === lang}
          onClick={() => update({ language: lang })}
          className={`rounded-ui px-2 py-1 uppercase ${settings.language === lang ? 'bg-surface text-ink' : 'text-ink-muted'}`}
        >
          {lang}
        </button>
      ))}
    </div>
  )
}
