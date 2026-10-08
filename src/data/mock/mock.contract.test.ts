import { runRepositoryContract } from '@/data/contract/repositoryContract';
import { createMockRepositories } from './MockRepositories';

runRepositoryContract('Mock', () => createMockRepositories({ latencyMs: 0 }));
