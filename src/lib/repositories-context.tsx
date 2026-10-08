import { createContext, useContext, type ReactNode } from 'react';
import type { Repositories } from '@/domain/repositories';

const RepositoriesContext = createContext<Repositories | null>(null);

export function RepositoriesProvider({
  repositories,
  children,
}: {
  repositories: Repositories;
  children: ReactNode;
}) {
  return (
    <RepositoriesContext.Provider value={repositories}>
      {children}
    </RepositoriesContext.Provider>
  );
}

/** The only way components get data access. They see interfaces, never implementations. */
export function useRepositories(): Repositories {
  const repositories = useContext(RepositoriesContext);
  if (!repositories)
    throw new Error('useRepositories must be used inside <RepositoriesProvider>');
  return repositories;
}
