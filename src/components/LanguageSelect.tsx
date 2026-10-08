import { getLocale, LOCALES, setLocale, t, type Locale } from '../i18n'

/**
 * A native select, sized like the toggles beside it: on a TV remote or a phone
 * the platform picker is easier to drive than any custom menu. It shows the
 * short code, so it stays as narrow as the icon buttons; the options carry each
 * language's own name.
 */
export function LanguageSelect() {
  const locale = getLocale()

  return (
    <label className="border-line-strong text-cream-dim relative flex h-11 cursor-pointer items-center rounded border px-3">
      <span className="num text-[0.9rem] font-medium uppercase" aria-hidden="true">
        {locale}
      </span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={t().language}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {LOCALES.map(({ code, name }) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </label>
  )
}
