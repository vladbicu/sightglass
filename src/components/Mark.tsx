import { useId } from 'react'

interface MarkProps {
  /** Ring and level line. Always cream when an SRM stripe is in frame. */
  ink?: string
  /** Wort below the level line. "none" leaves the kettle empty. */
  fill?: string
  /** Ring/line stroke on the 32-unit grid. Step up to 5 at favicon sizes. */
  weight?: number
  className?: string
}

/**
 * The Sightglass mark: a ring with a level line across it.
 *
 * A kettle seen from directly above with the wort level across it — read
 * another way, a dial with its needle at rest, or the meniscus in a hydrometer
 * jar. The chord sits at y=19.5 on a 32 grid (61% down) rather than centred:
 * high enough to read as liquid finding its own level, low enough that the mark
 * can never be mistaken for a slashed circle.
 *
 * The mark owns no colour of its own. Copper fill is reserved for places where
 * no beer colour is present — icon, favicon, empty state — so the SRM stripe
 * stays the only variable colour on screen.
 */
export function Mark({
  ink = 'var(--cream)',
  fill = 'none',
  weight = 3.8,
  className,
}: MarkProps) {
  // Several marks can share a page, so the clip path needs a unique id.
  const clipId = useId()

  return (
    <svg
      viewBox="0 0 32 32"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={{ display: 'block' }}
      aria-hidden="true"
      focusable="false"
    >
      <clipPath id={clipId}>
        <rect x="0" y="19.5" width="32" height="13" />
      </clipPath>
      <circle cx="16" cy="16" r="10.5" fill={fill} clipPath={`url(#${clipId})`} />
      <circle cx="16" cy="16" r="12.4" fill="none" stroke={ink} strokeWidth={weight} />
      <line x1="6" y1="19.5" x2="26" y2="19.5" stroke={ink} strokeWidth={weight} />
    </svg>
  )
}
