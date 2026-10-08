import { useState } from 'react'
import { BRAND_NAME } from './brand'
import { LanguageSelect } from './components/LanguageSelect'
import { Mark } from './components/Mark'
import { ThemeToggle } from './components/ThemeToggle'
import { type Messages, t, useLocale } from './i18n'
import { openWithFiles } from './lib/shareTarget'
import { readRecipeSession } from './lib/recipeSession'
import { parseStoredTaps, TAPLIST_STORAGE_KEY } from './lib/tapList'
import { useFileDrop } from './lib/useFileDrop'
import { useTheme } from './lib/useTheme'

const hubTitle = (m: Messages) => m.titleHub

function savedBeerCount(): number {
  try {
    return parseStoredTaps(localStorage.getItem(TAPLIST_STORAGE_KEY)).length
  } catch {
    return 0
  }
}

interface AppCardProps {
  name: string
  blurb: string
  href: string
  /** One file opens in the viewer; the tap list takes as many as are dropped. */
  multiple: boolean
  dropLabel: string
  /** The phone's version of the drop zone: there is nothing to drag there. */
  pickLabel: string
  /** A line of live state under the blurb, e.g. how many beers are on the board. */
  status?: string
}

/**
 * One app, presented whole: what it is, a drop zone that lands you inside it
 * with the file already loaded, and a plain link in for when there is nothing
 * to drop. Both cards are the same component on the same grid, so neither app
 * can drift into being the secondary one.
 */
function AppCard({ name, blurb, href, multiple, dropLabel, pickLabel, status }: AppCardProps) {
  const { dragging, pick, dropProps, inputProps } = useFileDrop(
    (files) => void openWithFiles(href, files),
    multiple,
  )
  const m = t()

  return (
    // Side by side, each card spans five rows of the parent grid and adopts
    // them as a subgrid, so the drop zones line up even when one blurb runs
    // longer. Stacked on a phone, each is a plain column.
    <article className="bg-oak border-line flex flex-col md:min-h-0 rounded-md border px-[clamp(1.25rem,2.5vw,2.25rem)] py-[clamp(0.9rem,3.5vh,2rem)] md:row-span-5 md:grid md:grid-rows-subgrid md:gap-0">
      <h2 className="display-title text-[clamp(1.6rem,min(4vw,5.5vh),3rem)] leading-none">
        {name}
      </h2>
      <p className="text-cream-dim mt-[clamp(0.4rem,1.6vh,1rem)] max-w-[40ch] text-[clamp(0.8rem,2.1vh,1.1rem)]">
        {blurb}
      </p>
      {/* Always rendered side by side, empty or not, so both cards keep five
          rows; dropped from the stacked layout when there is nothing to say. */}
      <p className="num text-copper-bright mt-[clamp(0.3rem,1.2vh,0.75rem)] text-[clamp(0.75rem,1.8vh,0.95rem)] empty:hidden md:empty:block">
        {status}
      </p>

      <button
        type="button"
        onClick={pick}
        {...dropProps}
        // Takes whatever height is left, and is the first thing to give when
        // the window is short: the page itself never scrolls.
        className={`mt-[clamp(0.5rem,2vh,1rem)] hidden min-h-0 flex-1 cursor-pointer flex-col items-center md:flex justify-center gap-[clamp(0.4rem,1.8vh,1rem)] overflow-hidden rounded border border-dashed px-4 py-[clamp(0.5rem,2.5vh,2rem)] text-center transition-colors ${
          dragging ? 'border-copper-bright bg-oak-raised' : 'border-line-strong'
        }`}
      >
        <span className="h-[clamp(1.75rem,7vh,3.5rem)] w-[clamp(1.75rem,7vh,3.5rem)] shrink-0 opacity-55">
          <Mark ink={dragging ? 'var(--copper-bright)' : 'var(--cream-faint)'} fill="none" />
        </span>
        <span className="text-cream-dim text-[clamp(0.8rem,2vh,1rem)]">{dropLabel}</span>
        <span className="num text-cream-faint text-[0.7rem] tracking-[0.1em] uppercase [@media(max-height:760px)]:hidden">
          .xml · .json · BeerXML · BeerJSON · Brewfather
        </span>
      </button>
      <input {...inputProps} />

      {/* One row on a phone; side by side the wrapper dissolves (`contents`)
          so the link stays the subgrid's fifth row. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 md:contents">
        <button
          type="button"
          onClick={pick}
          className="border-line-strong text-cream cursor-pointer rounded border px-3 py-1.5 text-[0.85rem] font-medium md:hidden"
        >
          {pickLabel}
        </button>
        <a
          href={href}
          className="text-copper-bright justify-self-start text-[clamp(0.85rem,2vh,1.05rem)] font-medium underline-offset-2 hover:underline md:mt-[clamp(0.5rem,2.2vh,1.5rem)]"
        >
          {m.openApp(name)}
        </a>
      </div>
    </article>
  )
}

/**
 * The landing page (`index.html`): both apps side by side as equals. Nothing
 * here holds state of its own — a drop hands the files straight to the chosen
 * app through the same Cache Storage hand-off the Android share target uses.
 */
export function Hub() {
  const { theme, toggleTheme } = useTheme()
  useLocale(hubTitle)
  const [beers] = useState(savedBeerCount)
  const [session] = useState(readRecipeSession)
  const openRecipe = session ? (session.recipes[session.index] ?? session.recipes[0])!.name : ''
  const m = t()

  return (
    // Exactly one screen: the cards share whatever height is left after the
    // header, tagline and footer, rather than the page growing past the fold.
    // A phone too short for both stacked cards grows instead of overlapping.
    <div className="mx-auto flex min-h-[100dvh] max-w-[1200px] md:h-[100dvh] flex-col px-4 py-[clamp(0.75rem,2.5vh,1.5rem)] sm:px-8">
      <header className="flex shrink-0 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9">
            <Mark ink="var(--cream)" fill="var(--copper)" />
          </span>
          <span className="wordmark text-[1.05rem]">{BRAND_NAME}</span>
        </div>
        <div className="flex gap-3">
          <LanguageSelect />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col py-[clamp(0.75rem,3vh,2rem)]">
        {/* On a phone the two blurbs already say this, and height is scarce. */}
        <p className="text-cream-dim mb-[clamp(0.75rem,3vh,2rem)] hidden max-w-[60ch] shrink-0 sm:block text-[clamp(0.85rem,2.3vh,1.2rem)]">
          {m.hubTagline}
        </p>

        <div className="grid min-h-0 flex-1 content-start gap-[clamp(0.75rem,2vh,1.5rem)] md:grid-cols-2 md:grid-rows-[auto_auto_auto_minmax(0,1fr)_auto] md:gap-y-0">
          <AppCard
            name={m.appRecipe}
            blurb={m.recipeBlurb}
            href="/recipe.html"
            multiple={false}
            dropLabel={m.dropOrPick}
            pickLabel={m.chooseFile}
            status={openRecipe ? m.recipeOpen(openRecipe) : undefined}
          />
          <AppCard
            name={m.appTaps}
            blurb={m.tapsBlurb}
            href="/robinete.html"
            multiple
            dropLabel={m.dropOrPickMany}
            pickLabel={m.chooseFiles}
            status={beers > 0 ? m.onBoard(m.beers(beers)) : undefined}
          />
        </div>
      </main>

      <p className="text-cream-faint shrink-0 text-center text-[clamp(0.7rem,1.8vh,0.95rem)]">
        {m.privacy}
      </p>
    </div>
  )
}
