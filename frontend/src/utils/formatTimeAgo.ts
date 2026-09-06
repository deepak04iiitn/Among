/**
 * formatTimeAgo.ts — Human-readable relative time for post timestamps.
 * Returns strings like "just now", "2 hours ago", "3 days ago".
 */
export function formatTimeAgo(dateString: string | Date): string {
  const date    = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60)                     return 'just now';
  if (seconds < 3600)                   return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)                  return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 7 * 86400)              return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 30 * 86400)             return `${Math.floor(seconds / (7 * 86400))}w ago`;
  if (seconds < 365 * 86400)            return `${Math.floor(seconds / (30 * 86400))}mo ago`;
  return `${Math.floor(seconds / (365 * 86400))}y ago`;
}
