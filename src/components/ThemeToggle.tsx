import { t } from '../i18n'
import type { Theme } from '../lib/useTheme'

interface ThemeToggleProps {
  theme: Theme
  onToggle: () => void
}

/**
 * Shows the theme it will switch *to*, which is the convention users expect
 * from a single-button toggle. There is no mouse on a TV, so the meaning cannot
 * live in a tooltip: the icon carries it, and an aria-label carries it for
 * screen readers.
 */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const goingLight = theme === 'dark'

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={goingLight ? t().themeToLight : t().themeToDark}
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
        aria-hidden="true"
        focusable="false"
      >
        {goingLight ? (
          <>
            <circle cx="12" cy="12" r="4.4" />
            <path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.3 5.3l1.9 1.9M16.8 16.8l1.9 1.9M18.7 5.3l-1.9 1.9M7.2 16.8l-1.9 1.9" />
          </>
        ) : (
          <path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z" />
        )}
      </svg>
    </button>
  )
}
