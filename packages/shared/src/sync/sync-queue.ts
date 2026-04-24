export type SyncOperation = () => Promise<void>;

export interface SyncQueueOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export class SyncQueue {
  private queue: Array<{ op: SyncOperation; retries: number }> = [];
  private running = false;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;

  constructor(options: SyncQueueOptions = {}) {
    this.maxRetries = options.maxRetries ?? 5;
    this.baseDelayMs = options.baseDelayMs ?? 1000;
    this.maxDelayMs = options.maxDelayMs ?? 32000;
  }

  enqueue(op: SyncOperation): void {
    this.queue.push({ op, retries: 0 });
    if (!this.running) {
      void this.flush();
    }
  }

  private async flush(): Promise<void> {
    this.running = true;
    while (this.queue.length > 0) {
      const item = this.queue[0];
      try {
        await item.op();
        this.queue.shift();
      } catch {
        item.retries += 1;
        if (item.retries >= this.maxRetries) {
          this.queue.shift();
        } else {
          const delay = Math.min(
            this.baseDelayMs * Math.pow(2, item.retries - 1),
            this.maxDelayMs,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    this.running = false;
  }

  get size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
    this.running = false;
  }
}
