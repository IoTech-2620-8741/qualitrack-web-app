import { ActuationAction, ActuationEvent } from './actuation-event.entity';
import { ContainerLock } from './container-lock';

const actionOf = (
  id: number,
  action: ActuationAction,
  occurredAt: string,
  result: 'EXECUTED' | 'FAILED' = 'EXECUTED',
  byRule = false,
) =>
  new ActuationEvent({
    id,
    deviceId: 9,
    environmentId: 1,
    action,
    triggerMetric: byRule ? 'TEMPERATURE' : null,
    triggerState: byRule ? 'CRITICAL' : null,
    result,
    occurredAt,
    profileVersion: 3,
  });

describe('ContainerLock', () => {
  it('is open after an RFID tag opened it, although the fan acted later', () => {
    const lock = ContainerLock.fromActions(
      [
        actionOf(1, 'SERVO_OPEN', '2026-11-28T10:42:00Z'),
        actionOf(2, 'VENTILATION_ON', '2026-11-28T10:43:00Z', 'EXECUTED', true),
      ],
      true,
    );

    expect(lock.status).toBe('OPEN');
    expect(lock.isOpen).toBe(true);
    expect(lock.openedByTag).toBe(true);
    expect(lock.lastMovement?.id).toBe(1);
    expect(lock.failure).toBeNull();
  });

  it('is closed after its last movement closed it, whatever the order of the actions', () => {
    const lock = ContainerLock.fromActions(
      [
        actionOf(2, 'SERVO_CLOSE', '2026-11-28T10:44:00Z'),
        actionOf(1, 'SERVO_OPEN', '2026-11-28T10:42:00Z'),
      ],
      true,
    );

    expect(lock.status).toBe('CLOSED');
    expect(lock.lastMovement?.id).toBe(2);
  });

  it('tells a rule opened it', () => {
    const lock = ContainerLock.fromActions(
      [actionOf(1, 'SERVO_OPEN', '2026-11-28T10:42:00Z', 'EXECUTED', true)],
      true,
    );

    expect(lock.isOpen).toBe(true);
    expect(lock.openedByTag).toBe(false);
  });

  it('is closed when it did not move in the period, as the node starts closed', () => {
    const lock = ContainerLock.fromActions(
      [actionOf(1, 'COOLING_ON', '2026-11-28T10:00:00Z')],
      true,
    );

    expect(lock.status).toBe('CLOSED');
    expect(lock.lastMovement).toBeNull();
  });

  it('keeps the last movement it executed and tells the one that failed after it', () => {
    const lock = ContainerLock.fromActions(
      [
        actionOf(1, 'SERVO_OPEN', '2026-11-28T10:42:00Z'),
        actionOf(2, 'SERVO_CLOSE', '2026-11-28T10:44:00Z', 'FAILED'),
      ],
      true,
    );

    expect(lock.status).toBe('OPEN');
    expect(lock.lastMovement?.id).toBe(1);
    expect(lock.failure?.id).toBe(2);
  });

  it('forgets a failure the lock recovered from', () => {
    const lock = ContainerLock.fromActions(
      [
        actionOf(1, 'SERVO_CLOSE', '2026-11-28T10:44:00Z', 'FAILED'),
        actionOf(2, 'SERVO_CLOSE', '2026-11-28T10:45:00Z'),
      ],
      true,
    );

    expect(lock.status).toBe('CLOSED');
    expect(lock.failure).toBeNull();
  });

  it('is unknown while the device is not reporting, and keeps its last known movement', () => {
    const lock = ContainerLock.fromActions(
      [actionOf(1, 'SERVO_OPEN', '2026-11-28T10:42:00Z')],
      false,
    );

    expect(lock.status).toBe('UNKNOWN');
    expect(lock.isOpen).toBe(false);
    expect(lock.lastMovement?.action).toBe('SERVO_OPEN');
  });

  it('can stand for a lock that could not be read', () => {
    const lock = ContainerLock.unknown();

    expect(lock.status).toBe('UNKNOWN');
    expect(lock.lastMovement).toBeNull();
  });
});
