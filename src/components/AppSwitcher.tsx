import { BRAND_NAME } from '../brand'
import { t } from '../i18n'
import { Mark } from './Mark'

export type AppId = 'recipe' | 'taps'

const PAGES: Record<AppId, string> = { recipe: '/recipe.html', taps: '/robinete.html' }

/**
 * The brand lockup (which goes home to the hub) followed by both apps as one
 * segmented control, so each page announces that the other exists — with equal
 * weight, rather than as a footnote link. Plain links: the apps are separate
 * pages, and a real href survives middle-click and a TV browser's focus ring.
 *
 * `compact` drops the wordmark for the one-screen views, where every pixel of
 * header is taken from the content.
 */
export function AppSwitcher({ current, compact }: { current: AppId; compact?: boolean }) {
  const m = t()
  const names: Record<AppId, string> = { recipe: m.appRecipe, taps: m.appTaps }

  return (
    <div className="flex items-center gap-4">
      <a href="/" className="flex items-center gap-3 no-underline" aria-label={BRAND_NAME}>
        <span className={compact ? 'h-8 w-8' : 'h-9 w-9'}>
          <Mark ink="var(--cream)" fill="var(--copper)" />
        </span>
        {/* Public Sans caps: the recipe title is already a Fraunces title, and
            never two serif titles in one view. It gives way first on a phone,
            where the switcher and the toggles need the row. */}
        {!compact && (
          <span className="wordmark hidden text-[1.05rem] sm:inline">{BRAND_NAME}</span>
        )}
      </a>

      <nav aria-label={m.apps} className="border-line-strong flex rounded border p-1">
        {(Object.keys(PAGES) as AppId[]).map((id) => (
          <a
            key={id}
            href={PAGES[id]}
            aria-current={id === current ? 'page' : undefined}
            className={`rounded-sm px-3.5 py-1.5 text-[0.9rem] font-medium no-underline ${
              id === current ? 'bg-oak-high text-cream' : 'text-cream-dim hover:text-cream'
            }`}
          >
            {names[id]}
          </a>
        ))}
      </nav>
    </div>
  )
}
