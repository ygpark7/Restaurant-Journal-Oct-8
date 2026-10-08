import type { User } from '@/domain/types';

/** The signed-out "you" for this phase. There's no auth yet. */
export const CURRENT_USER: User = { id: 'u-me', displayName: 'You', avatarEmoji: '🙂' };

/** Fake parents who wrote the seed notes. */
export const SEED_USERS: User[] = [
  { id: 'u-maya', displayName: 'Maya, mom of 2', avatarEmoji: '🧑‍🍼' },
  { id: 'u-dev', displayName: 'Dev, dad of a toddler', avatarEmoji: '👨‍🍼' },
  { id: 'u-priya', displayName: 'Priya, mom of twins', avatarEmoji: '👩‍🍼' },
  { id: 'u-jonah', displayName: 'Jonah, dad of 3', avatarEmoji: '🧔' },
  { id: 'u-lena', displayName: 'Lena, mom of a baby', avatarEmoji: '👩' },
];

export const ALL_USERS: User[] = [CURRENT_USER, ...SEED_USERS];
