import { t } from '../i18n'
import type { ViewMode } from '../lib/useViewMode'

interface ViewToggleProps {
  view: ViewMode
  onToggle: () => void
}

/**
 * Like ThemeToggle, shows the mode it will switch *to*: arrows pointing inward
 * to condense onto one screen, outward to expand back to the full ticket.
 */
export function ViewToggle({ view, onToggle }: ViewToggleProps) {
  const goingCondensed = view === 'full'

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={goingCondensed ? t().viewToCondensed : t().viewToFull}
      className="border-line-strong text-cream-dim flex h-11 w-11 cursor-pointer items-center justify-center rounded border"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {goingCondensed ? (
          <path d="M9.5 4.5v5h-5M14.5 4.5v5h5M9.5 19.5v-5h-5M14.5 19.5v-5h5" />
        ) : (
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        )}
      </svg>
    </button>
  )
}
