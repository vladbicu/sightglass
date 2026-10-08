// Cache name must match SHARE_CACHE in public/sw.js.
const SHARE_CACHE = 'share-target-v1'

interface ShareTargetMeta {
  names: string[]
}

let sharedFiles: Promise<File[]> | null = null

/**
 * Hands files to another page: stores them exactly where the service worker
 * puts a share_target POST, then navigates to `page?shared=1`, so the receiving
 * page has one way in for both. Used by the hub's drop zones. Without Cache
 * Storage (an insecure origin) the page still opens, just without the files.
 */
export async function openWithFiles(page: string, files: File[]): Promise<void> {
  if (!('caches' in window)) {
    location.href = page
    return
  }

  const cache = await caches.open(SHARE_CACHE)
  const meta: ShareTargetMeta = { names: files.map((file) => file.name) }
  await cache.put('/share-target-meta', new Response(JSON.stringify(meta)))
  await Promise.all(files.map((file, i) => cache.put(`/share-target-file-${i}`, new Response(file))))
  location.href = `${page}?shared=1`
}

/**
 * Picks up file(s) the service worker stashed in Cache Storage after intercepting
 * a share_target POST (see public/sw.js), or `[]` if there's nothing pending.
 *
 * Memoized per page load: React StrictMode runs effects twice in dev, and the
 * cache read is destructive (entries are deleted once consumed), so a second
 * call must reuse the first call's result rather than racing it.
 */
export function consumeSharedFiles(): Promise<File[]> {
  if (!sharedFiles) sharedFiles = readSharedFiles()
  return sharedFiles
}

async function readSharedFiles(): Promise<File[]> {
  if (!('caches' in window)) return []

  const cache = await caches.open(SHARE_CACHE)
  const metaResponse = await cache.match('/share-target-meta')
  if (!metaResponse) return []

  const { names } = (await metaResponse.json()) as ShareTargetMeta
  const files: File[] = []

  for (let i = 0; i < names.length; i++) {
    const fileResponse = await cache.match(`/share-target-file-${i}`)
    if (!fileResponse) continue
    const blob = await fileResponse.blob()
    files.push(new File([blob], names[i], { type: blob.type || 'application/xml' }))
  }

  await Promise.all(
    ['/share-target-meta', ...names.map((_, i) => `/share-target-file-${i}`)].map((key) =>
      cache.delete(key),
    ),
  )

  return files
}
