export interface MockOptions {
  /** Fixed delay, or a [min, max] range in ms. Default 300–800. Use 0 in tests. */
  latencyMs?: number | [number, number];
  /** 0..1 chance that any call rejects. Handy for exercising error states. */
  failureRate?: number;
  /** Reject every call. */
  forceError?: boolean;
}

export class MockNetworkError extends Error {
  constructor() {
    super('Simulated network error (mock data layer)');
    this.name = 'MockNetworkError';
  }
}

const DEFAULT_LATENCY: [number, number] = [300, 800];

function delayFor(latency: MockOptions['latencyMs']): number {
  const [min, max] =
    latency === undefined
      ? DEFAULT_LATENCY
      : typeof latency === 'number'
        ? [latency, latency]
        : latency;
  return min + Math.random() * (max - min);
}

/** Wait, maybe fail, then run `work` (so reads see the data as it is "on arrival"). */
export async function simulateNetwork<T>(
  options: MockOptions,
  work: () => T,
): Promise<T> {
  const ms = delayFor(options.latencyMs);
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
  if (options.forceError || Math.random() < (options.failureRate ?? 0)) {
    throw new MockNetworkError();
  }
  return work();
}
