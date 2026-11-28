import { ActuationEvent } from './actuation-event.entity';

/**
 * Condition of the lock of a container monitor:
 * - `OPEN`: its last movement opened it.
 * - `CLOSED`: its last movement closed it, or it did not move in the period, since the node starts
 *   with the lock closed and reports every movement.
 * - `UNKNOWN`: the device is not reporting or could not be read, so the lock may have moved since.
 */
export type ContainerLockStatus = 'OPEN' | 'CLOSED' | 'UNKNOWN';

/**
 * Lock of a container monitor, read from the actions of its servo (`SERVO_OPEN` and `SERVO_CLOSE`).
 *
 * An authorized RFID tag opens the lock and the same tag closes it, or it closes by itself after
 * 2 minutes; a rule of the profile can also open it. Only a movement the node executed changes the
 * lock: a `FAILED` one left it as it was.
 *
 * @example
 * const lock = ContainerLock.fromActions(actions, connection.isConnected);
 * console.log(lock.status, lock.openedByTag); // 'OPEN' true
 */
export class ContainerLock {
  /**
   * @param status - Condition of the lock
   * @param lastMovement - Last movement the lock executed in the period, or null if it did not move
   * @param failure - The latest movement when the node could not execute it, or null
   */
  constructor(
    readonly status: ContainerLockStatus,
    readonly lastMovement: ActuationEvent | null,
    readonly failure: ActuationEvent | null,
  ) {}

  /**
   * Reads the lock from the actions of a container monitor.
   *
   * @param actions - Actions of the container monitor in the period, in any order
   * @param reporting - Whether the device reports; when it does not, the lock may have moved since
   * @returns The lock of the container
   */
  static fromActions(actions: readonly ActuationEvent[], reporting: boolean): ContainerLock {
    const movements = actions
      .filter((action) => action.action === 'SERVO_OPEN' || action.action === 'SERVO_CLOSE')
      .sort((first, second) => Date.parse(first.occurredAt) - Date.parse(second.occurredAt));
    let lastMovement: ActuationEvent | null = null;
    for (const movement of movements) {
      if (movement.result === 'EXECUTED') lastMovement = movement;
    }
    const latest = movements.at(-1);
    const failure = latest?.result === 'FAILED' ? latest : null;
    if (!reporting) return new ContainerLock('UNKNOWN', lastMovement, failure);
    return new ContainerLock(
      lastMovement?.action === 'SERVO_OPEN' ? 'OPEN' : 'CLOSED',
      lastMovement,
      failure,
    );
  }

  /**
   * The lock of a container monitor that could not be read.
   *
   * @returns A lock in the `UNKNOWN` condition, without movements
   */
  static unknown(): ContainerLock {
    return new ContainerLock('UNKNOWN', null, null);
  }

  /** Whether the lock is open, as far as its movements tell. */
  get isOpen(): boolean {
    return this.status === 'OPEN';
  }

  /** Whether an RFID tag opened the lock: its last movement is an opening no rule caused. */
  get openedByTag(): boolean {
    return this.lastMovement?.action === 'SERVO_OPEN' && this.lastMovement.triggerMetric === null;
  }
}
