import { useEffect } from 'react'
import { TapBoard } from './components/TapBoard'
import { TapUpload } from './components/TapUpload'
import { type Messages, useLocale } from './i18n'
import { consumeSharedFiles } from './lib/shareTarget'
import { useTapList } from './lib/useTapList'
import { useTheme } from './lib/useTheme'
import { useWakeLock } from './lib/useWakeLock'

/**
 * The tap list page: upload several BeerXML files, keep them across reloads, and
 * show each beer with only the facts a taproom board carries. A separate HTML
 * entry (`robinete.html`) — there is no router.
 */
const tapsTitle = (m: Messages) => m.titleTaps

export function TapList() {
  const { theme, toggleTheme } = useTheme()
  useLocale(tapsTitle)
  const { taps, tapCount, setTapCount, errors, addFiles, remove, move, clear } = useTapList()

  // A TV behind the bar shouldn't dim mid-service.
  useWakeLock(taps.length > 0)

  // A beer shared here from another app (e.g. Grainfather's export) lands via
  // the share_target service worker, which redirects with `?shared=1`.
  useEffect(() => {
    if (!location.search.includes('shared=1')) return
    history.replaceState(null, '', '/robinete.html')
    consumeSharedFiles().then((files) => {
      if (files.length > 0) addFiles(files)
    })
  }, [addFiles])

  if (taps.length === 0) {
    return (
      <TapUpload full onFiles={addFiles} errors={errors} theme={theme} onToggleTheme={toggleTheme} />
    )
  }

  return (
    <TapBoard
      taps={taps}
      tapCount={tapCount}
      onTapCountChange={setTapCount}
      errors={errors}
      onAdd={addFiles}
      onRemove={remove}
      onMove={move}
      onClear={clear}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  )
}
