import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

/**
 * A bottom sheet on phones, a centered dialog on larger screens. Built on the native
 * <dialog>, which gives us a focus trap, Esc to close, and inert background for free.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Mouse-only convenience: clicks on the backdrop land on the <dialog> element itself.
  // (Keyboard users close with Esc or the close button.)
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close();
    };
    dialog.addEventListener('click', onClick);
    return () => dialog.removeEventListener('click', onClick);
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="sheet m-0 mt-auto w-full max-w-none rounded-t-[1.75rem] bg-cream-50 p-0 text-ink-900 shadow-card backdrop:bg-ink-900/40 md:m-auto md:max-w-lg md:rounded-[1.75rem]"
    >
      {open && (
        <div className="flex max-h-[88dvh] flex-col">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <h2 id={titleId} className="text-xl font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 flex size-11 items-center justify-center rounded-full hover:bg-cream-200"
            >
              <Icon name="x" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
          {footer && (
            <div className="border-t border-cream-300 bg-cream-50 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
