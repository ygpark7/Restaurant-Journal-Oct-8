/** Only follow in-app paths after login, never "//evil.com" or "https://…". */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\'))
    return '/';
  return next;
}

export function loginPath(next: string): string {
  return `/login?next=${encodeURIComponent(safeNext(next))}`;
}
