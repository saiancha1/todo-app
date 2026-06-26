/**
 * Due dates arrive as UTC ISO strings (…Z). The browser parses them and we render
 * in the user's local timezone, so the displayed date is always correct for the viewer.
 */
export function formatDueDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** True when a non-null, non-completed due date is in the past. */
export function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}
