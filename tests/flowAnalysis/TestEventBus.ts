type TestHandler<T = unknown> = (payload: T) => void;

export class TestEventBus {
  private readonly listeners = new Map<string, Set<TestHandler<unknown>>>();

  on<T>(event: string, handler: TestHandler<T>): () => void {
    const typedHandler = handler as TestHandler<unknown>;
    const bucket = this.listeners.get(event) ?? new Set<TestHandler<unknown>>();
    bucket.add(typedHandler);
    this.listeners.set(event, bucket);

    return () => this.off(event, typedHandler);
  }

  emit<T>(event: string, payload: T): void {
    const bucket = this.listeners.get(event);
    if (!bucket) {
      return;
    }

    for (const handler of bucket) {
      handler(payload as unknown);
    }
  }

  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
      return;
    }

    this.listeners.clear();
  }

  listenerCount(event?: string): number {
    if (event) {
      return this.listeners.get(event)?.size ?? 0;
    }

    let total = 0;
    for (const bucket of this.listeners.values()) {
      total += bucket.size;
    }
    return total;
  }

  private off(event: string, handler: TestHandler<unknown>): void {
    const bucket = this.listeners.get(event);
    if (!bucket) {
      return;
    }

    bucket.delete(handler);
    if (bucket.size === 0) {
      this.listeners.delete(event);
    }
  }
}
