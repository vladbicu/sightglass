/** Small readers for untyped JSON exports — every lookup tolerates a missing or wrong-typed field. */

export type JsonObject = Record<string, unknown>

export function isObject(v: unknown): v is JsonObject {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function obj(v: unknown): JsonObject {
  return isObject(v) ? v : {}
}

export function list(v: unknown): JsonObject[] {
  return Array.isArray(v) ? v.filter(isObject) : []
}

export function text(v: unknown): string {
  return typeof v === 'string' || typeof v === 'number' ? String(v).trim() : ''
}

export function number(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string' && v.trim() !== '') {
    const parsed = Number(v)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
