import { BRAND_NAME } from '../brand'
import { t } from '../i18n'
import { fermentationLabel, readings, subtitle } from '../lib/recipeSummary'
import { srmToRgb } from '../lib/srm'
import type { Recipe } from '../lib/types'
import type { Theme } from '../lib/useTheme'
import type { ViewMode } from '../lib/useViewMode'
import { FermentablesSection } from './FermentablesSection'
import { HopsSection } from './HopsSection'
import { LanguageSelect } from './LanguageSelect'
import { Mark } from './Mark'
import { MashSection } from './MashSection'
import { MiscSection } from './MiscSection'
import { ThemeToggle } from './ThemeToggle'
import { ViewToggle } from './ViewToggle'
import { YeastSection } from './YeastSection'

interface RecipeTicketProps {
  recipe: Recipe
  onReset: () => void
  /** Only rendered when a batch export held more than one recipe. */
  position: { index: number; total: number; onNext: () => void } | null
  theme: Theme
  onToggleTheme: () => void
  view: ViewMode
  onToggleView: () => void
}

export function RecipeTicket({
  recipe,
  onReset,
  position,
  theme,
  onToggleTheme,
  view,
  onToggleView,
}: RecipeTicketProps) {
  const stats = readings(recipe)
  const fermentation = fermentationLabel(recipe)
  const beerColor = srmToRgb(recipe.color)
  const m = t()

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Horizontal lockup. The wordmark steps down to Public Sans caps
            because the recipe title below is already a Fraunces title, and
            never two serif titles in one view. */}
        <div className="flex items-center gap-3">
          <span className="h-9 w-9">
            <Mark ink="var(--cream)" fill="var(--copper)" />
          </span>
          <span className="wordmark text-[1.05rem]">{BRAND_NAME}</span>
        </div>
        <div className="flex items-center gap-3">
          {position && (
            <>
              <span className="num text-cream-faint text-[0.95rem]">
                {m.recipeOf(position.index + 1, position.total)}
              </span>
              <button
                type="button"
                onClick={position.onNext}
                className="border-line-strong text-cream cursor-pointer rounded border px-4 py-2 text-[0.95rem] font-medium"
              >
                {m.next}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onReset}
            className="border-line-strong text-cream-dim cursor-pointer rounded border px-4 py-2 text-[0.95rem] font-medium"
          >
            {m.loadAnother}
          </button>
          <ViewToggle view={view} onToggle={onToggleView} />
          <LanguageSelect />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>

      <article className="bg-oak flex overflow-hidden rounded-md">
        {/* Vertical band carrying the beer's actual SRM colour. On light the
            well behind it turns dark, because a pale beer laid straight onto
            paper dissolves into the card; on dark it is transparent and the
            stripe meets the card edge exactly as before. */}
        <div
          className="w-3 shrink-0 sm:w-5"
          style={{ backgroundColor: 'var(--stripe-well)', padding: 'var(--stripe-well-pad)' }}
        >
          <div
            className="h-full w-full"
            style={{ backgroundColor: beerColor, borderRadius: 'var(--stripe-radius)' }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <header className="px-7 py-9 sm:px-10 sm:py-11">
            <h1 className="display-title text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.05]">
              {recipe.name}
            </h1>
            {subtitle(recipe) && (
              <p className="text-copper-bright mt-3 text-[1.2rem]">{subtitle(recipe)}</p>
            )}
            {(recipe.brewer || recipe.date) && (
              <p className="text-cream-faint mt-2 text-[1.05rem]">
                {[recipe.brewer, recipe.date].filter(Boolean).join(' · ')}
              </p>
            )}
          </header>

          <div className="border-line grid grid-cols-2 gap-x-6 gap-y-8 border-t px-7 py-9 sm:px-10 md:grid-cols-4 lg:grid-cols-5">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className={`stat-value ${stat.accent ? 'text-copper-bright!' : ''}`}>
                  {stat.value}
                  {stat.unit && <span className="stat-unit">{stat.unit}</span>}
                </p>
                <p className="stat-label mt-3">{stat.label}</p>
              </div>
            ))}
          </div>

          {(recipe.ibuMethod || fermentation) && (
            <div className="border-line text-cream-faint flex flex-wrap gap-x-8 gap-y-2 border-t px-7 py-5 text-[1rem] sm:px-10">
              {recipe.ibuMethod && <span>{m.ibuBy(recipe.ibuMethod)}</span>}
              {fermentation && <span>{m.fermentationLine(fermentation)}</span>}
            </div>
          )}

          <FermentablesSection fermentables={recipe.fermentables} />
          <HopsSection hops={recipe.hops} boilTime={recipe.boilTime} />
          <MashSection steps={recipe.mashSteps} mashName={recipe.mashName} />
          <YeastSection yeasts={recipe.yeasts} />
          <MiscSection miscs={recipe.miscs} />

          {recipe.notes && (
            <section className="border-line border-t px-7 py-9 sm:px-10">
              <h2 className="section-title mb-4">{m.notes}</h2>
              <p className="text-cream-dim max-w-[70ch] text-[1.1rem] whitespace-pre-wrap">
                {recipe.notes}
              </p>
            </section>
          )}
        </div>
      </article>
    </div>
  )
}
