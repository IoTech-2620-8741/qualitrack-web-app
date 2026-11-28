import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TrackingStore } from './tracking.store';
import { TrackingApi } from '../infrastructure/tracking-api';
import { IamStore } from '../../iam/application/iam.store';
import { MonitoredDevice } from '../domain/model/monitored-device.entity';
import { ActuationAction, ActuationEvent } from '../domain/model/actuation-event.entity';
import { DeviceConnection } from '../domain/model/device-connection.entity';

describe('TrackingStore', () => {
  const container = new MonitoredDevice({ id: 9, name: 'CNT-001', deviceType: 'CONTAINER_MONITOR', environmentId: 1 });
  const environmental = new MonitoredDevice({ id: 7, name: 'ENV-001', deviceType: 'ENVIRONMENTAL_DEVICE', environmentId: 1 });

  const actionOf = (id: number, action: ActuationAction, occurredAt: string) =>
    new ActuationEvent({
      id,
      deviceId: 9,
      environmentId: 1,
      action,
      triggerMetric: null,
      triggerState: null,
      result: 'EXECUTED',
      occurredAt,
      profileVersion: 3,
    });

  function create(actions: ActuationEvent[], connectionStatus: 'CONNECTED' | 'REQUIRES_REVIEW' = 'CONNECTED') {
    const api = {
      getDevices: vi.fn(() => of([environmental, container])),
      getMeasurements: vi.fn(() => of([])),
      getActuationEvents: vi.fn(() => of(actions)),
      getDeviceConnection: vi.fn((_: number, __: number, deviceId: number) =>
        of(
          new DeviceConnection({
            id: deviceId,
            connectionStatus,
            lastCommunicationAt: '2026-11-28T10:00:00Z',
            expectedPeriodSeconds: 30,
          }),
        ),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: TrackingApi, useValue: api },
        { provide: IamStore, useValue: { requireLaboratoryId: () => 1, canManageQuality: signal(true) } },
      ],
    });
    return { store: TestBed.inject(TrackingStore), api };
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-28T12:00:00Z'));
  });

  afterEach(() => vi.useRealTimers());

  it('reads the lock of a container from the actions of the last 7 days', async () => {
    const { store, api } = create([
      actionOf(1, 'SERVO_OPEN', '2026-11-25T08:00:00Z'),
      actionOf(2, 'VENTILATION_ON', '2026-11-25T08:05:00Z'),
    ]);
    await store.selectEnvironment(1);

    await store.loadSnapshots();

    const [, period] = api.getActuationEvents.mock.calls[0] as unknown as [unknown, { from: string; to: string }];
    expect(period.from).toBe('2026-11-21T12:00:00.000Z');
    expect(period.to).toBe('2026-11-28T12:00:00.000Z');
    const snapshot = store.snapshots().find((current) => current.device.id === 9);
    expect(snapshot?.lock?.status).toBe('OPEN');
    // The last action stays the one of the last 24 hours
    expect(snapshot?.lastAction).toBeNull();
    expect(store.snapshots().find((current) => current.device.id === 7)?.lock).toBeNull();
    expect(api.getActuationEvents).toHaveBeenCalledTimes(1);
  });

  it('keeps the last action of the last 24 hours', async () => {
    const { store } = create([
      actionOf(1, 'SERVO_OPEN', '2026-11-28T10:42:00Z'),
      actionOf(2, 'SERVO_CLOSE', '2026-11-28T10:44:00Z'),
    ]);
    await store.selectEnvironment(1);

    await store.loadSnapshots();

    const snapshot = store.snapshots().find((current) => current.device.id === 9);
    expect(snapshot?.lastAction?.id).toBe(2);
    expect(snapshot?.lock?.status).toBe('CLOSED');
  });

  it('does not know the lock of a container that is not reporting', async () => {
    const { store } = create([actionOf(1, 'SERVO_OPEN', '2026-11-28T10:42:00Z')], 'REQUIRES_REVIEW');
    await store.selectEnvironment(1);

    await store.loadSnapshots();

    expect(store.snapshots().find((current) => current.device.id === 9)?.lock?.status).toBe('UNKNOWN');
  });

  it('refreshes quietly, without the loading state', async () => {
    const { store } = create([]);
    await store.selectEnvironment(1);

    const loading = store.loadSnapshots(true);

    expect(store.isLoading()).toBe(false);
    await loading;
    expect(store.snapshots().length).toBe(2);
    // The header tells the time of this reading, although it did not show the loading state
    expect(store.snapshotsUpdatedAt()).toEqual(new Date('2026-11-28T12:00:00Z'));
  });
});
