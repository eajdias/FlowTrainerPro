// core/engine/EventBus.ts
// Minimal typed pub/sub. Engines emit; stores/panels observe.
// No business logic here — only delivery.

type Handler<T> = (payload: T) => void;

class EventBus {
  private handlers = new Map<string, Set<Handler<never>>>();

  on<T>(event: string, handler: Handler<T>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    const h = handler as Handler<never>;
    set.add(h);
    return () => {
      set.delete(h);
    };
  }

  emit<T>(event: string, payload: T): void {
    const set = this.handlers.get(event);
    if (!set || set.size === 0) return;
    for (const h of Array.from(set)) {
      (h as Handler<T>)(payload);
    }
  }

  clear(event?: string): void {
    if (event) this.handlers.delete(event);
    else this.handlers.clear();
  }
}

export const eventBus = new EventBus();
