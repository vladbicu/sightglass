import { useEffect, useSyncExternalStore } from 'react'
import { de } from './messages/de'
import { en, type Messages } from './messages/en'
import { fr } from './messages/fr'
import { ro } from './messages/ro'

export type Locale = 'en' | 'ro' | 'de' | 'fr'

/** In menu order; each language is named in itself so anyone can find their own. */
export const LOCALES: readonly { code: Locale; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'ro', name: 'Română' },
]

const MESSAGES: Record<Locale, Messages> = { en, ro, de, fr }

/** Internal key; like the other `cazan-*` ones it predates the Sightglass name. */
export const LOCALE_STORAGE_KEY = 'cazan-lang'

function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && v in MESSAGES
}

/**
 * `?lang=de` wins, so a link posted in a German group opens in German; then the
 * stored choice; then the browser's languages; then English, since nearly every
 * homebrewer reads it.
 */
export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en'

  const fromUrl = new URLSearchParams(window.location.search).get('lang')?.toLowerCase()
  if (isLocale(fromUrl)) {
    store(fromUrl)
    return fromUrl
  }

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    // Blocked storage — fall through to the browser's preference.
  }

  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.slice(0, 2).toLowerCase()
    if (isLocale(base)) return base
  }
  return 'en'
}

function store(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Preference just won't survive the reload; not worth surfacing.
  }
}

/**
 * The current locale lives at module level rather than in React context: the
 * formatting helpers in lib/ (`formatDuration`, `readings`, the parsers' error
 * messages) need it too, and threading it through every call would touch every
 * signature for no gain. Each page root subscribes with `useLocale`, so a change
 * re-renders the whole tree.
 */
let current: Locale = detectLocale()
const listeners = new Set<() => void>()

export function getLocale(): Locale {
  return current
}

export function setLocale(locale: Locale) {
  if (locale === current) return
  current = locale
  store(locale)
  for (const listener of listeners) listener()
}

/** The messages for the current locale. */
export function t(): Messages {
  return MESSAGES[current]
}

/**
 * A value written by the exporting app (USE, TYPE, FORM — always English) in
 * the current language, or as written when it isn't one we know.
 */
export function term(value: string): string {
  return t().terms[value.trim().toLowerCase()] ?? value
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Subscribes a page root to locale changes and keeps `<html lang>` and the tab
 * title in step. `title` is read from the messages so it follows the switch.
 */
export function useLocale(title: (m: Messages) => string): Locale {
  const locale = useSyncExternalStore(subscribe, getLocale, getLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = title(MESSAGES[locale])
  }, [locale, title])

  return locale
}

export type { Messages }
