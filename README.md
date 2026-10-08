# Cazan

You load a recipe export — BeerXML (Grainfather, Brewfather, BeerSmith),
BeerJSON, or Brewfather's own JSON — and see it as a
recipe ticket set in large type, made for a second monitor or a TV in the
brewery, read from 2-3 metres away.

The name comes from the boil kettle — *cazan* in Romanian, the copper vessel at
the middle of any brew day, and the source of the interface's accent colour.

Everything runs client-side: no backend, no database, no upload. The open
recipe lives in the tab's `sessionStorage`: it survives a reload and a trip to
the tap list and back, and disappears when the tab is closed — deliberately,
this is a viewer for brew day, not a recipe library.

## Pages

Three Vite entries, no router:

- `index.html` — the hub: both apps side by side as equal cards, each with its
  own drop zone. A drop hands the files to that app through Cache Storage and
  `?shared=1`, the same hand-off the Android share target uses.
- `recipe.html` — the single-recipe viewer.
- `robinete.html` — the tap list.

Both apps carry the same switcher in their header (`AppSwitcher`): the brand
goes back to the hub, and a segmented control moves between the two.

## Tap list

Drop in several recipe files and it keeps them as a **tap list**: one
row per beer with a large colour square (exact SRM · EBC printed under it), the
board figures — ABV, IBU, OG→FG — and, to educate the drinker, the hop varieties
and yeast strain. The whole board scales to a single screen like the condensed
recipe view.

The bar has a fixed number of taps (set in the header, default 3). The first N
beers on the ordered list are **On tap**, numbered by tap position; the rest
sit below under **Up next**; any tap with no beer shows as **Empty**. Dragging a
beer across the divider is how it goes on or comes off tap. A row is removed
with its `×`, and "Clear" empties the board.

Unlike the viewer, the tap list **persists** — in `localStorage` under
`cazan-taplist` — because a curated board is only useful if it stays put. It is
still only the browser's own storage; nothing leaves the machine. The theme
choice is shared with the viewer.

## Languages

English, German, French and Romanian, without an i18n library: each language is
one file in `src/i18n/messages/`, typed against `en.ts`, so a missing or extra
key fails `npm run typecheck`. Counted phrases are functions, so each language
owns its plural rules (Romanian's "20 de zile").

The language comes from `?lang=de` in the URL (handy for links posted in a
group), then the stored choice (`cazan-lang`), then the browser, then English.
Values written by the exporting app — `Dry Hop`, `Pellet`, `Grain` — are
translated through each language's `terms` map; anything unknown shows as
written. Gravities keep the decimal point in every language.

The product name lives in `src/brand.ts` alone, pending a new international
name.

## Commands

```bash
npm run dev        # development server
npm test           # parser tests (run in Node against fixtures/)
npm run typecheck  # strict tsc
npm run build      # production build
npm run preview    # serve the build locally
```

## Structure

```
src/lib/parseRecipe.ts    entry point: detects the format by content
src/lib/parseBeerXML.ts   BeerXML parsing + normalisation + decoding by encoding
src/lib/parseBeerJSON.ts  BeerJSON ({unit, value} quantities → metric)
src/lib/parseBrewfatherJSON.ts  Brewfather's own recipe/batch JSON
src/lib/ibu.ts            Tinseth fallback when an export names no IBU figure
src/lib/types.ts          the data model
src/lib/srm.ts            SRM → colour
src/lib/format.ts         masses, durations, gravities
src/lib/tapList.ts        tap-list model + storage (pure, tested)
src/components/           UploadZone, RecipeTicket + sections, TapBoard, TapUpload
fixtures/                 real exports used as test fixtures
```

## What the parser tolerates

Real-world exports depart from the BeerXML spec in several ways, all covered by
tests in `src/lib/parseBeerXML.test.ts`:

- **Alternative tag names** — `getTag(node, ...names)` tries several names
  case-insensitively, so `NAME`/`n` and `OG`/`EST_OG` resolve through the same
  mechanism.
- **"Estimated" fields** — `EST_OG`/`EST_FG`/`EST_ABV`/`EST_COLOR` when the
  standard ones are missing; ABV is computed from OG/FG if both are absent.
- **`BOIL_SIZE` = 0** — treated as absent, so "0 L" never shows up on screen.
- **Empty self-closing tags** (`<NOTES/>`, `<TYPE/>`) — an empty string, not an
  error.
- **`USE` values beyond the standard ones** — `Hop Stand` with
  `TEMPERATURE`/`HOP_TEMP` gets its own grouping, separate from boil and dry hop.
- **`DISPLAY_AMOUNT`** — preferred over `AMOUNT` in kg for small additions.
- **Composite style code** — Grainfather does not write `<CATEGORY>`, but
  `CATEGORY_NUMBER` + `STYLE_LETTER`, reassembled into "21B".
- **Encoding declared in the prolog** — the file is read as an `ArrayBuffer` and
  decoded according to `encoding="..."` (e.g. `ISO-8859-1`), not assumed to be
  UTF-8.
- **Numeric character references and units in values** — Brewfather writes
  `Elderflower&#32;Ale` and `<EST_COLOR>9.1 SRM</EST_COLOR>`; both are decoded,
  and a colour declared in EBC is converted to SRM.
- **Variable root** — `<RECIPES><RECIPE>` or `<RECIPE>` directly; several
  recipes in the same file are accepted, and one corrupt recipe does not
  invalidate the others.

The JSON formats are covered in `src/lib/parseRecipe.test.ts`, which checks that
Brewfather's three exports of the same recipe produce the same `Recipe`. Two
caveats: BeerJSON carries no IBU figure (only the method), so it is estimated
with Tinseth over the batch volume and reads a few IBU below Brewfather's own;
and Brewfather JSON stores dry-hop / fermenter addition times in days, which is
assumed rather than seen in a fixture.

## Themes

**Dark** by default, whatever the operating system asks for: the app lives on a
TV watched from across the room, where a screen full of warm white at brew-day
brightness is a lamp pointed at you. The light theme is an explicit choice, from
the toggle button, for a second monitor or a sunlit garage — the preference is
kept in `localStorage` (the recipe only in `sessionStorage`, for the tab's life).

## Casting to a TV

While a recipe is on screen, the app holds a `screen wake lock`, so the cast
session is not interrupted when the source laptop would fall asleep. The API
requires HTTPS or `localhost` and is missing on older Safari — failure is
silent.

If the TV has its own browser, opening a deployed URL directly on the TV is more
stable than casting. Deployment is not configured in the repo.
