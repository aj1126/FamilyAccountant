import { SyncQueue } from '../../../../shared/src/sync/sync-queue';

/** Waits for a set amount of real milliseconds */
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe('SyncQueue', () => {
  it('should execute an enqueued operation', async () => {
    const queue = new SyncQueue({ baseDelayMs: 0, maxDelayMs: 0 });
    const op = jest.fn().mockResolvedValue(undefined);

    let resolved!: () => void;
    const done = new Promise<void>((r) => { resolved = r; });
    queue.enqueue(async () => { await op(); resolved(); });

    await done;
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('should process operations sequentially in enqueue order', async () => {
    const order: number[] = [];
    const queue = new SyncQueue({ baseDelayMs: 0, maxDelayMs: 0 });

    let resolved!: () => void;
    const done = new Promise<void>((r) => { resolved = r; });

    queue.enqueue(async () => { order.push(1); });
    queue.enqueue(async () => { order.push(2); });
    queue.enqueue(async () => { order.push(3); resolved(); });

    await done;
    expect(order).toEqual([1, 2, 3]);
  });

  it('should report correct queue size', async () => {
    const queue = new SyncQueue({ baseDelayMs: 0, maxDelayMs: 0 });

    let unblock!: () => void;
    queue.enqueue(() => new Promise<void>((r) => { unblock = r; }));
    queue.enqueue(async () => {});

    // First op is actively running, second is waiting
    expect(queue.size).toBe(2);

    unblock();
    await wait(20);
    expect(queue.size).toBe(0);
  });

  it('should clear all pending operations and reflect size 0', async () => {
    const executed: string[] = [];
    const queue = new SyncQueue({ baseDelayMs: 0, maxDelayMs: 0 });

    let unblock!: () => void;
    queue.enqueue(() => new Promise<void>((r) => { unblock = r; }));
    queue.enqueue(async () => { executed.push('shouldNotRun'); });

    expect(queue.size).toBe(2);
    queue.clear();
    expect(queue.size).toBe(0);

    // Let the running op finish; the cleared pending op must NOT run
    unblock();
    await wait(20);
    expect(executed).not.toContain('shouldNotRun');
  });

  it('should not start a second concurrent flush when enqueue is called during an active flush', async () => {
    const queue = new SyncQueue({ baseDelayMs: 0, maxDelayMs: 0 });

    let unblock!: () => void;
    const firstOp = jest.fn(() => new Promise<void>((r) => { unblock = r; }));
    const secondOp = jest.fn().mockResolvedValue(undefined);

    queue.enqueue(firstOp);
    // flush() is now blocked on firstOp
    queue.enqueue(secondOp); // must not trigger a second flush

    unblock(); // let firstOp complete
    await wait(20);

    expect(firstOp).toHaveBeenCalledTimes(1);
    expect(secondOp).toHaveBeenCalledTimes(1);
  });

  it('should retry a failing operation up to maxRetries times then discard it', async () => {
    const queue = new SyncQueue({ maxRetries: 3, baseDelayMs: 5, maxDelayMs: 20 });
    const failing = jest.fn().mockRejectedValue(new Error('fail'));

    let resolved!: () => void;
    const done = new Promise<void>((r) => { resolved = r; });

    // Enqueue a sentinel after the failing op so we know when the queue is drained
    queue.enqueue(failing);
    queue.enqueue(async () => { resolved(); });

    await done;
    // maxRetries = 3 means it tries 3 times then gives up
    expect(failing).toHaveBeenCalledTimes(3);
    // Allow the flush loop to call queue.shift() on the sentinel
    await Promise.resolve();
    expect(queue.size).toBe(0);
  });

  it('should apply exponential backoff between retries', async () => {
    const delays: number[] = [];
    let lastCallTime = Date.now();

    const queue = new SyncQueue({ maxRetries: 3, baseDelayMs: 20, maxDelayMs: 200 });
    const failing = jest.fn().mockImplementation(async () => {
      const now = Date.now();
      delays.push(now - lastCallTime);
      lastCallTime = now;
      throw new Error('fail');
    });

    let resolved!: () => void;
    const done = new Promise<void>((r) => { resolved = r; });
    queue.enqueue(failing);
    queue.enqueue(async () => { resolved(); });

    await done;
    // First call is immediate; subsequent calls should have increasing delays
    // delays[1] >= baseDelayMs (20ms) and delays[2] >= 2*baseDelayMs (40ms)
    expect(delays[1]).toBeGreaterThanOrEqual(15);
    expect(delays[2]).toBeGreaterThanOrEqual(delays[1]);
  });
});

