import { Fragment, useMemo, useState } from 'react'
import { getLocale, t } from '../i18n'
import { formatGravity, formatNumber } from '../lib/format'
import { hopNames, subtitle, yeastNames } from '../lib/recipeSummary'
import { srmToEbc, srmToRgb } from '../lib/srm'
import { MAX_TAP_COUNT, type Tap } from '../lib/tapList'
import { useFitToScreen } from '../lib/useFitToScreen'
import type { Theme } from '../lib/useTheme'
import { AppSwitcher } from './AppSwitcher'
import { LanguageSelect } from './LanguageSelect'
import { TapUpload } from './TapUpload'
import { ThemeToggle } from './ThemeToggle'

interface TapBoardProps {
  taps: Tap[]
  tapCount: number
  onTapCountChange: (value: number) => void
  errors: string[]
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
  onMove: (from: number, to: number) => void
  onClear: () => void
  theme: Theme
  onToggleTheme: () => void
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  if (value === '') return null
  return (
    <div className="text-right">
      <p className={`num text-[2rem] leading-none font-medium ${accent ? 'text-copper-bright' : ''}`}>
        {value}
      </p>
      <p className="stat-label mt-1.5 text-[0.65rem]">{label}</p>
    </div>
  )
}

/** Six dots — the usual "drag me" affordance, no mouse-only tooltip needed. */
function Grip() {
  return (
    <svg viewBox="0 0 12 20" width="12" height="20" aria-hidden="true" className="fill-current">
      {[4, 10, 16].map((cy) =>
        [3, 9].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.4" />),
      )}
    </svg>
  )
}

/** The tap's position on the wall — 1..N — or a hollow badge for a free tap. */
function TapNumber({ n, free }: { n: number; free?: boolean }) {
  return (
    <span
      className={`num flex h-11 w-11 shrink-0 items-center justify-center rounded border text-[1.4rem] font-medium ${
        free
          ? 'border-line text-cream-faint border-dashed'
          : 'border-line-strong text-copper-bright'
      }`}
    >
      {n}
    </span>
  )
}

function SrmSquare({ srm }: { srm: number | null }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      {/* A big square so a drinker can read the colour across the room; the well
          behind it turns dark on the light theme so pale beers don't vanish. */}
      <span
        className="h-20 w-20"
        style={{ backgroundColor: 'var(--stripe-well)', padding: 'var(--stripe-well-pad)' }}
      >
        <span
          className="block h-full w-full"
          style={{ backgroundColor: srmToRgb(srm), borderRadius: 'var(--stripe-radius)' }}
        />
      </span>
      {srm !== null && (
        <span className="num text-cream-faint text-[0.7rem] whitespace-nowrap">
          SRM {formatNumber(srm)} · EBC {formatNumber(srmToEbc(srm), 0)}
        </span>
      )}
    </div>
  )
}

interface TapRowProps {
  tap: Tap
  /** Tap position when live; null while the beer is only queued. */
  number: number | null
  dragging: boolean
  dropTarget: boolean
  onRemove: () => void
  onDragStart: () => void
  onDragEnter: () => void
  onDrop: () => void
  onDragEnd: () => void
}

function TapRow({
  tap,
  number,
  dragging,
  dropTarget,
  onRemove,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragEnd,
}: TapRowProps) {
  const { recipe } = tap
  const gravity =
    formatGravity(recipe.og) && formatGravity(recipe.fg)
      ? `${formatGravity(recipe.og)}→${formatGravity(recipe.fg)}`
      : formatGravity(recipe.og) || formatGravity(recipe.fg)
  const hops = hopNames(recipe)
  const yeasts = yeastNames(recipe)
  const m = t()

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-5 py-4 ${dragging ? 'opacity-40' : ''} ${
        dropTarget ? 'bg-oak-raised' : ''
      } ${number === null ? 'opacity-60' : ''}`}
    >
      <span className="text-cream-faint shrink-0 cursor-grab" aria-hidden="true">
        <Grip />
      </span>

      {number === null ? <span className="w-11 shrink-0" /> : <TapNumber n={number} />}

      <SrmSquare srm={recipe.color} />

      <div className="min-w-0 flex-1">
        <p className="display-title truncate text-[1.9rem] leading-tight">{recipe.name}</p>
        {subtitle(recipe) && (
          <p className="text-copper-bright truncate text-[0.95rem]">{subtitle(recipe)}</p>
        )}
        {(hops.length > 0 || yeasts.length > 0) && (
          <dl className="mt-2 space-y-0.5 text-[0.95rem] leading-tight">
            {hops.length > 0 && (
              <div className="flex gap-2.5">
                <dt className="eyebrow shrink-0 pt-[0.15rem] text-[0.65rem]">{m.hops}</dt>
                <dd className="text-cream-dim min-w-0 truncate">{hops.join(' · ')}</dd>
              </div>
            )}
            {yeasts.length > 0 && (
              <div className="flex gap-2.5">
                <dt className="eyebrow shrink-0 pt-[0.15rem] text-[0.65rem]">
                  {m.yeast(yeasts.length)}
                </dt>
                <dd className="text-cream-dim min-w-0 truncate">{yeasts.join(' · ')}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      <div className="flex shrink-0 items-end gap-7">
        <Stat value={formatNumber(recipe.abv)} label="ABV" accent />
        <Stat value={formatNumber(recipe.ibu, 0)} label="IBU" />
        <Stat value={gravity} label="OG · FG" />
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={m.removeBeer(recipe.name)}
        className="text-cream-faint hover:text-danger shrink-0 cursor-pointer px-2 text-[1.5rem] leading-none"
      >
        ×
      </button>
    </li>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <li className="pt-5 pb-2 first:pt-0">
      <span className="eyebrow">{children}</span>
    </li>
  )
}

/**
 * The whole tap list on one screen, for a television behind the bar. Same
 * approach as CondensedTicket: lay the rows out at their natural size, measure
 * once, scale the lot down to fit. No page scroll is possible — the viewport is
 * the frame.
 *
 * The board is one ordered list; the first `tapCount` beers are what's actually
 * pouring (numbered by tap), the rest are waiting their turn. Dragging a beer
 * across the divider is how it goes on or comes off tap.
 */
export function TapBoard({
  taps,
  tapCount,
  onTapCountChange,
  errors,
  onAdd,
  onRemove,
  onMove,
  onClear,
  theme,
  onToggleTheme,
}: TapBoardProps) {
  const m = t()
  // The locale is part of the key: a language switch changes every label's width.
  const locale = getLocale()
  const fitKey = useMemo(() => ({ taps, tapCount, locale }), [taps, tapCount, locale])
  const { containerRef, contentRef, scale } = useFitToScreen(fitKey)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const endDrag = () => {
    setDragIndex(null)
    setOverIndex(null)
  }

  const handleDrop = (target: number) => {
    if (dragIndex !== null && dragIndex !== target) onMove(dragIndex, target)
    endDrag()
  }

  const clear = () => {
    if (window.confirm(m.clearConfirm)) onClear()
  }

  const live = Math.min(tapCount, taps.length)
  const queuedCount = taps.length - live
  const freeSlots = Math.max(0, tapCount - taps.length)

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-6 pt-4 pb-2">
        <div className="flex items-center gap-4">
          <AppSwitcher current="taps" compact />
          <span className="num text-cream-faint text-[0.9rem]">
            {m.beers(taps.length)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="border-line-strong flex items-center gap-2 rounded border px-2.5 py-1">
            <span className="stat-label text-[0.6rem]">{m.tapCount}</span>
            <button
              type="button"
              onClick={() => onTapCountChange(tapCount - 1)}
              disabled={tapCount <= 1}
              aria-label={m.oneTapLess}
              className="text-cream-dim cursor-pointer px-1 text-[1.2rem] leading-none disabled:opacity-30"
            >
              −
            </button>
            <span className="num text-cream w-4 text-center text-[1rem]">{tapCount}</span>
            <button
              type="button"
              onClick={() => onTapCountChange(tapCount + 1)}
              disabled={tapCount >= MAX_TAP_COUNT}
              aria-label={m.oneTapMore}
              className="text-cream-dim cursor-pointer px-1 text-[1.2rem] leading-none disabled:opacity-30"
            >
              +
            </button>
          </div>
          <TapUpload onFiles={onAdd} />
          <button
            type="button"
            onClick={clear}
            className="border-line-strong text-cream-dim cursor-pointer rounded border px-4 py-2 text-[0.9rem] font-medium"
          >
            {m.clear}
          </button>
          <LanguageSelect />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>

      {errors.length > 0 && (
        <div role="alert" className="text-danger shrink-0 px-6 pb-2 text-[0.9rem]">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <div ref={containerRef} className="min-h-0 flex-1 px-[10%] pb-5">
        <div
          ref={contentRef}
          style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
          className="mx-auto w-full max-w-[1400px]"
        >
          <ul className="divide-line divide-y">
            {taps.length > 0 && <SectionLabel>{m.onTap}</SectionLabel>}

            {taps.map((tap, i) => (
              <Fragment key={tap.id}>
                {i === live && queuedCount > 0 && (
                  <SectionLabel>{m.upNext}</SectionLabel>
                )}
                <TapRow
                  tap={tap}
                  number={i < live ? i + 1 : null}
                  dragging={dragIndex === i}
                  dropTarget={overIndex === i && dragIndex !== i}
                  onRemove={() => onRemove(tap.id)}
                  onDragStart={() => setDragIndex(i)}
                  onDragEnter={() => setOverIndex(i)}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={endDrag}
                />
              </Fragment>
            ))}

            {Array.from({ length: freeSlots }, (_, k) => (
              <li key={`free-${k}`} className="flex items-center gap-5 py-4 opacity-50">
                <span className="w-3 shrink-0" />
                <TapNumber n={taps.length + k + 1} free />
                <span className="border-line-strong h-20 w-20 shrink-0 rounded border border-dashed" />
                <p className="display-title text-cream-faint flex-1 text-[1.9rem] leading-tight">
                  {m.freeTap}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
