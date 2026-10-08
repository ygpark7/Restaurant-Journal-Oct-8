import { useCallback } from 'react';
import { useToast } from '@/components/Toast';

export interface ShareInput {
  title: string;
  text: string;
  /** App path, e.g. "/restaurants/abc". Placeholder link for now: it points at this app's origin. */
  path: string;
}

/** Web Share API where available, otherwise copy the link and say so. */
export function useShare() {
  const toast = useToast();

  return useCallback(
    async ({ title, text, path }: ShareInput) => {
      const url = new URL(path, window.location.origin).toString();

      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ title, text, url });
          return;
        } catch (error) {
          // Closing the share sheet isn't an error.
          if (error instanceof DOMException && error.name === 'AbortError') return;
          // Anything else: fall through to copying the link.
        }
      }

      try {
        await navigator.clipboard.writeText(url);
        toast('Link copied');
      } catch {
        toast(`Couldn't copy automatically. Link: ${url}`);
      }
    },
    [toast],
  );
}
