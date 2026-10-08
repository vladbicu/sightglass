import { t } from '../i18n'
import { useFileDrop } from '../lib/useFileDrop'
import type { Theme } from '../lib/useTheme'
import { AppSwitcher } from './AppSwitcher'
import { LanguageSelect } from './LanguageSelect'
import { Mark } from './Mark'
import { ThemeToggle } from './ThemeToggle'

interface TapUploadProps {
  onFiles: (files: File[]) => void
  /** Full-screen empty state when true; a lone "+ Add" button when false. */
  full?: boolean
  errors?: string[]
  theme?: Theme
  onToggleTheme?: () => void
}

export function TapUpload({ onFiles, full, errors = [], theme, onToggleTheme }: TapUploadProps) {
  const { dragging, pick, dropProps, inputProps } = useFileDrop(onFiles, true)
  const m = t()

  if (!full) {
    return (
      <>
        <button
          type="button"
          onClick={pick}
          className="border-line-strong text-cream-dim cursor-pointer rounded border px-4 py-2 text-[0.9rem] font-medium"
        >
          {m.add}
        </button>
        <input {...inputProps} />
      </>
    )
  }

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-[900px] flex-col px-6 py-4 sm:justify-center sm:py-[clamp(4.5rem,8vh,5rem)]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:absolute sm:top-4 sm:right-4 sm:left-4 sm:mb-0">
        <AppSwitcher current="taps" />
        {theme && onToggleTheme && (
          <div className="flex gap-3">
            <LanguageSelect />
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={pick}
        {...dropProps}
        className={`bg-oak border-line flex w-full cursor-pointer flex-col items-center gap-[clamp(1rem,3.5vh,2.75rem)] rounded border px-8 py-[clamp(1.75rem,7vh,5rem)] text-center transition-colors ${
          dragging ? 'border-copper-bright bg-oak-raised' : ''
        }`}
      >
        <span className="h-[clamp(64px,14vh,132px)] w-[clamp(64px,14vh,132px)] opacity-55">
          <Mark ink={dragging ? 'var(--copper-bright)' : 'var(--cream-faint)'} fill="none" />
        </span>

        <span className="flex flex-col items-center gap-3">
          <span className="display-title text-[clamp(1.5rem,4vh,2.75rem)] leading-tight">
            {m.tapsEmpty}
          </span>
          <span className="text-cream-dim text-[1.15rem]">{m.dropTaps}</span>
        </span>

        <span className="bg-line-strong h-px w-[180px]" />

        <span className="num text-cream-faint text-[0.85rem] tracking-[0.1em] uppercase">
          .xml · .json · BeerXML · BeerJSON · Brewfather
        </span>
      </button>

      <input {...inputProps} />

      <p className="text-cream-faint mt-[clamp(1rem,3vh,2rem)] text-center text-[0.95rem]">
        {m.tapsSaved}
      </p>

      {errors.length > 0 && (
        <div
          role="alert"
          className="border-danger-line bg-danger-veil mt-[clamp(1rem,3vh,2rem)] rounded border px-6 py-5"
        >
          <p className="text-danger mb-2 text-[1.05rem] font-semibold">{m.someFilesFailed}</p>
          <ul className="text-cream-dim space-y-1 text-[1rem]">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
