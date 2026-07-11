type Listener = (data: any) => void;

class EventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }
}

export const eventBus = new EventBus();