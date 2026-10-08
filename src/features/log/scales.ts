import type { Rating } from '@/domain/types';

export interface ScaleStep {
  value: Rating;
  emoji: string;
  label: string;
}

/** How was the food? */
export const FOOD_SCALE: readonly ScaleStep[] = [
  { value: 1, emoji: '😖', label: 'Not good' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😋', label: 'Tasty' },
  { value: 5, emoji: '🤩', label: 'Amazing' },
];

/** How stressful was it with the kids? 1 is the calmest. */
export const STRESS_SCALE: readonly ScaleStep[] = [
  { value: 1, emoji: '😌', label: 'Totally relaxed' },
  { value: 2, emoji: '🙂', label: 'Pretty calm' },
  { value: 3, emoji: '😅', label: 'Manageable' },
  { value: 4, emoji: '😟', label: 'Stressful' },
  { value: 5, emoji: '😵', label: 'Chaos' },
];

export function scaleStep(scale: readonly ScaleStep[], value: number): ScaleStep {
  return scale.find((s) => s.value === value) ?? scale[0]!;
}
