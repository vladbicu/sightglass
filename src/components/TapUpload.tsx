import { useRef, useState } from 'react'
import { RECIPE_FILE_ACCEPT } from '../lib/parseRecipe'
import type { Theme } from '../lib/useTheme'
import { Mark } from './Mark'
import { ThemeToggle } from './ThemeToggle'


interface TapUploadProps {
  onFiles: (files: File[]) => void
  /** Full-screen empty state when true; a lone "+ Adaugă" button when false. */
  full?: boolean
  errors?: string[]
  theme?: Theme
  onToggleTheme?: () => void
}

export function TapUpload({ onFiles, full, errors = [], theme, onToggleTheme }: TapUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const pick = () => inputRef.current?.click()

  const input = (
    <input
      ref={inputRef}
      type="file"
      multiple
      accept={RECIPE_FILE_ACCEPT}
      className="hidden"
      onChange={(e) => {
        const files = Array.from(e.target.files ?? [])
        if (files.length > 0) onFiles(files)
        // Reset so re-picking the same file still fires onChange.
        e.target.value = ''
      }}
    />
  )

  if (!full) {
    return (
      <>
        <button
          type="button"
          onClick={pick}
          className="border-line-strong text-cream-dim cursor-pointer rounded border px-4 py-2 text-[0.9rem] font-medium"
        >
          + Adaugă
        </button>
        {input}
      </>
    )
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const files = Array.from(event.dataTransfer.files)
    if (files.length > 0) onFiles(files)
  }

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-[900px] flex-col justify-center px-6 py-[clamp(1rem,4vh,3rem)]">
      {theme && onToggleTheme && (
        <div className="absolute top-4 right-4">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      )}

      <button
        type="button"
        onClick={pick}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`bg-oak border-line flex w-full cursor-pointer flex-col items-center gap-[clamp(1rem,3.5vh,2.75rem)] rounded border px-8 py-[clamp(1.75rem,7vh,5rem)] text-center transition-colors ${
          dragging ? 'border-copper-bright bg-oak-raised' : ''
        }`}
      >
        <span className="h-[clamp(64px,14vh,132px)] w-[clamp(64px,14vh,132px)] opacity-55">
          <Mark ink={dragging ? 'var(--copper-bright)' : 'var(--cream-faint)'} fill="none" />
        </span>

        <span className="flex flex-col items-center gap-3">
          <span className="display-title text-[clamp(1.5rem,4vh,2.75rem)] leading-tight">
            Niciun robinet încă
          </span>
          <span className="text-cream-dim text-[1.15rem]">
            Trage aici fișiere de rețetă — câte vrei
          </span>
        </span>

        <span className="bg-line-strong h-px w-[180px]" />

        <span className="num text-cream-faint text-[0.85rem] tracking-[0.1em] uppercase">
          .xml · .json · BeerXML · BeerJSON · Brewfather
        </span>
      </button>

      {input}

      <p className="text-cream-faint mt-[clamp(1rem,3vh,2rem)] text-center text-[0.95rem]">
        Robinetele rămân salvate în acest browser.{' '}
        <a href="/index.html" className="text-copper-bright underline-offset-2 hover:underline">
          Deschide o rețetă →
        </a>
      </p>

      {errors.length > 0 && (
        <div
          role="alert"
          className="border-danger-line bg-danger-veil mt-[clamp(1rem,3vh,2rem)] rounded border px-6 py-5"
        >
          <p className="text-danger mb-2 text-[1.05rem] font-semibold">
            Unele fișiere nu au putut fi citite
          </p>
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
