/**
 * Cache duration constants in seconds
 */
export const CACHE_DURATIONS = {
  /** Very short cache - 30 seconds */
  VERY_SHORT: 30,
  /** Short cache - 1 minute */
  SHORT: 60,
  /** Medium cache - 5 minutes */
  MEDIUM: 300,
  /** Long cache - 15 minutes */
  LONG: 900,
  /** Very long cache - 1 hour */
  VERY_LONG: 3600,
  /** Extra long cache - 24 hours */
  EXTRA_LONG: 86400,
} as const;

/**
 * Get cache control headers for a given duration
 */
export function getCacheHeaders(durationSeconds: number): Record<string, string> {
  return {
    "Cache-Control": `public, s-maxage=${durationSeconds}, stale-while-revalidate=${durationSeconds * 2}`,
  };
}
