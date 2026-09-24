/** COTTON_ORGANIC → "Cotton organic". */
export function humanize(code: string): string {
  const words = code.toLowerCase().replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** The API answers errors as { statusCode, message }. */
export function apiErrorMessage(error: unknown): string {
  const message = (error as { data?: { message?: unknown } }).data?.message;
  return typeof message === 'string'
    ? message
    : 'Something went wrong. Please try again.';
}
