import { useId, useState } from 'react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { fileToSmallDataUrl } from '@/lib/image';

/** Optional photo. Local preview only: nothing is uploaded anywhere in this phase. */
export function PhotoPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      onChange(await fileToSmallDataUrl(file));
    } catch {
      setError("That photo couldn't be read. Try a different one.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-base font-semibold">Photo (optional)</p>
      {value ? (
        <div className="flex items-center gap-3">
          <img
            src={value}
            alt="Preview of what you added"
            className="size-24 rounded-2xl object-cover"
          />
          <Button variant="danger" onClick={() => onChange(null)}>
            <Icon name="trash" size={20} /> Remove photo
          </Button>
        </div>
      ) : (
        <>
          <label
            htmlFor={inputId}
            className="flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-full border-2 border-sage-600 px-5 text-base font-semibold text-sage-700 hover:bg-sage-50 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sage-600"
          >
            <Icon name="camera" /> Add a photo
            <input
              id={inputId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          <p className="text-sm text-ink-500">Stays on this device for now.</p>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
