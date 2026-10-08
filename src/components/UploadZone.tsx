import { t } from '../i18n'
import { useFileDrop } from '../lib/useFileDrop'
import type { Theme } from '../lib/useTheme'
import { AppSwitcher } from './AppSwitcher'
import { LanguageSelect } from './LanguageSelect'
import { Mark } from './Mark'
import { ThemeToggle } from './ThemeToggle'

interface UploadZoneProps {
  onFile: (file: File) => void
  errors: string[]
  theme: Theme
  onToggleTheme: () => void
}

export function UploadZone({ onFile, errors, theme, onToggleTheme }: UploadZoneProps) {
  const { dragging, pick, dropProps, inputProps } = useFileDrop((files) => onFile(files[0]!), false)
  const m = t()

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-[900px] flex-col px-6 py-4 sm:justify-center sm:py-[clamp(4.5rem,8vh,5rem)]">
      {/* Out of the flow from sm up, so the kettle centres on the true
          viewport centre rather than being pushed down by a header row. On a
          phone there is no room to overlay it, so it sits above the kettle. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:absolute sm:top-4 sm:right-4 sm:left-4 sm:mb-0">
        <AppSwitcher current="recipe" />
        <div className="flex gap-3">
          <LanguageSelect />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>

      {/* The empty kettle: the same mark, unfilled and dimmed to the faint
          tier. No arrow — the level line already points at the horizontal. */}
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
            {m.emptyKettle}
          </span>
          <span className="text-cream-dim text-[1.15rem]">{m.dropRecipe}</span>
        </span>

        <span className="bg-line-strong h-px w-[180px]" />

        <span className="num text-cream-faint text-[0.85rem] tracking-[0.1em] uppercase">
          .xml · .json · BeerXML · BeerJSON · Brewfather
        </span>
      </button>

      <input {...inputProps} />

      <p className="text-cream-faint mt-[clamp(1rem,3vh,2rem)] text-center text-[0.95rem]">
        {m.privacy}
      </p>

      {errors.length > 0 && (
        <div
          role="alert"
          className="border-danger-line bg-danger-veil mt-[clamp(1rem,3vh,2rem)] rounded border px-6 py-5"
        >
          <p className="text-danger mb-2 text-[1.05rem] font-semibold">{m.uploadFailed}</p>
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
