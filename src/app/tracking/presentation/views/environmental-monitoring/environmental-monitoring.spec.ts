import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateService, TranslationObject, provideTranslateService } from '@ngx-translate/core';
import { DeviceSnapshot, TrackingStore } from '../../../application/tracking.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { MonitoredDevice } from '../../../domain/model/monitored-device.entity';
import { ActuationAction, ActuationEvent } from '../../../domain/model/actuation-event.entity';
import { ContainerLock } from '../../../domain/model/container-lock';
import { DeviceConnection } from '../../../domain/model/device-connection.entity';
import { EnvironmentalMonitoring } from './environmental-monitoring';

describe('EnvironmentalMonitoring', () => {
  const environmentalDevice = new MonitoredDevice({
    id: 7,
    name: 'ENV-001',
    deviceType: 'ENVIRONMENTAL_DEVICE',
    environmentId: 1,
  });

  const containerMonitor = new MonitoredDevice({ id: 9, name: 'CNT-001', deviceType: 'CONTAINER_MONITOR', environmentId: 1 });
  const secondContainer = new MonitoredDevice({ id: 10, name: 'CNT-002', deviceType: 'CONTAINER_MONITOR', environmentId: 1 });

  const connected = new DeviceConnection({
    id: 9,
    connectionStatus: 'CONNECTED',
    lastCommunicationAt: '2026-11-28T10:45:00Z',
    expectedPeriodSeconds: 30,
  });
  const notReporting = new DeviceConnection({
    id: 9,
    connectionStatus: 'REQUIRES_REVIEW',
    lastCommunicationAt: '2026-11-28T08:00:00Z',
    expectedPeriodSeconds: 30,
  });

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
      triggerState: byRule ? 'WARNING' : null,
      result,
      occurredAt,
      profileVersion: 3,
    });

  /** A container monitor with a lock and the last action, like the store reads it. */
  function containerSnapshot(
    lock: ContainerLock,
    options: { device?: MonitoredDevice; lastAction?: ActuationEvent | null; connection?: DeviceConnection | null } = {},
  ): DeviceSnapshot {
    return {
      device: options.device ?? containerMonitor,
      readings: new Map(),
      lastMotion: null,
      lastAction: options.lastAction ?? null,
      lock,
      connection: options.connection === undefined ? connected : options.connection,
      failed: false,
    };
  }

  let fixture: ComponentFixture<EnvironmentalMonitoring>;
  let loadSnapshots: ReturnType<typeof vi.fn>;

  function render(
    readings: Map<string, unknown>,
    containerSnapshots: unknown[] = [],
    translations: TranslationObject | null = null,
  ) {
    const snapshot = { device: environmentalDevice, readings, lastMotion: null, lastAction: null, lock: null, connection: null, failed: false };
    loadSnapshots = vi.fn(() => Promise.resolve());
    TestBed.configureTestingModule({
      imports: [EnvironmentalMonitoring],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: IamStore, useValue: { canManageQuality: () => true } },
        {
          provide: TrackingStore,
          useValue: {
            environments: signal([{ id: 1, name: 'Raw material storage' }]),
            environmentId: signal(1),
            environmentsEmpty: signal(false),
            isLoading: signal(false),
            error: signal(null),
            devices: signal([environmentalDevice]),
            snapshots: signal([snapshot, ...containerSnapshots]),
            snapshotsUpdatedAt: signal(null),
            environmentalDevice: signal(environmentalDevice),
            containerMonitors: signal(containerSnapshots.map((container) => (container as DeviceSnapshot).device)),
            preferredEnvironmentId: () => 1,
            loadEnvironments: () => Promise.resolve(),
            rememberEnvironment: () => undefined,
            selectEnvironment: () => Promise.resolve(),
            loadSnapshots,
          },
        },
      ],
    });
    if (translations) {
      const translate = TestBed.inject(TranslateService);
      translate.setTranslation('en', translations);
      translate.use('en');
    }
    fixture = TestBed.createComponent(EnvironmentalMonitoring);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function readingOf(page: HTMLElement, label: string): HTMLElement | undefined {
    return Array.from(page.querySelectorAll<HTMLElement>('.reading')).find(
      (reading) => reading.querySelector('.label')?.textContent?.trim() === label,
    );
  }

  it('shows the luminosity of the room next to the air quality', () => {
    const page = render(
      new Map([
        ['AIR_QUALITY', { metric: 'AIR_QUALITY', value: 412.5, unit: 'ppm', state: 'NORMAL', measuredAt: '2026-11-26T05:00:00Z' }],
        ['LUMINOSITY', { metric: 'LUMINOSITY', value: 300, unit: 'lux', state: 'NORMAL', measuredAt: '2026-11-26T05:00:00Z' }],
      ]),
    );

    expect(readingOf(page, 'tracking.metrics.AIR_QUALITY')?.textContent).toContain('ppm');
    const luminosity = readingOf(page, 'tracking.metrics.LUMINOSITY');
    expect(luminosity?.querySelector('strong')?.textContent).toContain('300');
    expect(luminosity?.querySelector('strong')?.textContent).toContain('lux');
  });

  it('says there is no recent luminosity when the device has not sent one', () => {
    const page = render(
      new Map([
        ['AIR_QUALITY', { metric: 'AIR_QUALITY', value: 412.5, unit: 'ppm', state: 'NORMAL', measuredAt: '2026-11-26T05:00:00Z' }],
      ]),
    );

    expect(readingOf(page, 'tracking.metrics.LUMINOSITY')?.textContent).toContain('tracking.monitoring.no-recent-reading');
  });

  it('keeps the readings, the lock, the RFID tag and the last action of a container in one row of readings', () => {
    const measuredAt = '2026-11-26T05:00:00Z';
    const page = render(new Map(), [
      {
        device: containerMonitor,
        readings: new Map([
          ['TEMPERATURE', { metric: 'TEMPERATURE', value: 26.4, unit: '°C', state: 'WARNING', measuredAt }],
          ['HUMIDITY', { metric: 'HUMIDITY', value: 45, unit: '%RH', state: 'NORMAL', measuredAt }],
          ['RFID_TAG', { metric: 'RFID_TAG', value: null, textValue: 'DE:AD:BE:EF', unit: 'tag', state: null, measuredAt }],
        ]),
        lastMotion: null,
        lastAction: { action: 'VENTILATION_ON', triggerMetric: 'TEMPERATURE', triggerState: 'WARNING', occurredAt: measuredAt },
        lock: ContainerLock.fromActions([], true),
        connection: null,
        failed: false,
      },
    ]);

    const container = page.querySelectorAll<HTMLElement>('.device-list .device-card');
    expect(container.length).toBe(1);
    const labels = Array.from(container[0].querySelectorAll('.readings > .reading .label')).map((label) => label.textContent?.trim());
    expect(labels).toEqual([
      'tracking.metrics.TEMPERATURE',
      'tracking.metrics.HUMIDITY',
      'tracking.metrics.LUMINOSITY',
      'tracking.lock.title',
      'tracking.metrics.RFID_TAG',
      'tracking.monitoring.last-action',
    ]);
    // The condition of a reading sits next to its metric
    expect(readingOf(page, 'tracking.metrics.TEMPERATURE')?.querySelector('.reading-head .state')?.textContent).toContain(
      'tracking.states.WARNING',
    );
    expect(readingOf(page, 'tracking.metrics.RFID_TAG')?.querySelector('.tag')?.textContent).toContain('DE:AD:BE:EF');
  });

  describe('lock', () => {
    it('shows a lock an RFID tag opened although the fan acted after it, and names the open containers', () => {
      const opening = actionOf(1, 'SERVO_OPEN', '2026-11-28T10:42:00Z');
      const ventilation = actionOf(2, 'VENTILATION_ON', '2026-11-28T10:43:00Z', 'EXECUTED', true);
      const page = render(
        new Map(),
        [
          containerSnapshot(ContainerLock.fromActions([opening, ventilation], true), { lastAction: ventilation }),
          containerSnapshot(ContainerLock.fromActions([], true), { device: secondContainer }),
        ],
        { tracking: { lock: { 'summary-open': 'Open containers: {{names}}' } } },
      );

      const lock = readingOf(page, 'tracking.lock.title');
      expect(lock?.querySelector('strong')?.textContent).toContain('tracking.lock.OPEN');
      expect(lock?.querySelector('strong')?.classList).toContain('open');
      expect(lock?.textContent).toContain('tracking.lock.by-tag');
      expect(lock?.textContent).toContain('tracking.lock.since');
      // Only the open one is named, and the summary does not claim they are all closed
      expect(page.querySelector('.lock-open')?.textContent).toContain('Open containers: CNT-001');
      expect(page.querySelector('.lock-open')?.textContent).not.toContain('CNT-002');
      expect(page.querySelector('.lock-closed')).toBeNull();
      expect(readingOf(page, 'tracking.monitoring.last-action')?.textContent).toContain('tracking.actions.VENTILATION_ON');
    });

    it('tells the rule that keeps a lock open', () => {
      const page = render(new Map(), [
        containerSnapshot(
          ContainerLock.fromActions([actionOf(1, 'SERVO_OPEN', '2026-11-28T10:42:00Z', 'EXECUTED', true)], true),
        ),
      ]);

      const lock = readingOf(page, 'tracking.lock.title');
      expect(lock?.textContent).toContain('tracking.metrics.TEMPERATURE');
      expect(lock?.textContent).toContain('tracking.states.WARNING');
      expect(lock?.textContent).not.toContain('tracking.lock.by-tag');
    });

    it('says all the containers are closed when none is open or unknown', () => {
      const page = render(new Map(), [
        containerSnapshot(
          ContainerLock.fromActions(
            [actionOf(1, 'SERVO_OPEN', '2026-11-28T10:42:00Z'), actionOf(2, 'SERVO_CLOSE', '2026-11-28T10:44:00Z')],
            true,
          ),
        ),
        containerSnapshot(ContainerLock.fromActions([], true), { device: secondContainer }),
      ]);

      expect(page.querySelector('.lock-closed')?.textContent).toContain('tracking.lock.summary-closed');
      expect(page.querySelector('.lock-open')).toBeNull();
      const locks = Array.from(page.querySelectorAll<HTMLElement>('.device-card')).map(
        (card) => readingOf(card, 'tracking.lock.title')?.textContent ?? '',
      );
      expect(locks[1]).toContain('tracking.lock.CLOSED');
      expect(locks[1]).toContain('tracking.lock.since');
      expect(locks[2]).toContain('tracking.lock.no-movement');
    });

    it('does not guess the lock of a container that is not reporting', () => {
      const page = render(new Map(), [
        containerSnapshot(
          ContainerLock.fromActions([actionOf(1, 'SERVO_OPEN', '2026-11-28T10:42:00Z')], false),
          { connection: notReporting },
        ),
      ]);

      const lock = readingOf(page, 'tracking.lock.title');
      expect(lock?.querySelector('strong')?.textContent).toContain('tracking.lock.UNKNOWN');
      expect(lock?.textContent).toContain('tracking.lock.last-movement');
      expect(lock?.textContent).toContain('tracking.lock.not-reporting');
      expect(page.querySelector('.lock-unknown')?.textContent).toContain('tracking.lock.summary-unknown');
      expect(page.querySelector('.lock-closed')).toBeNull();
    });

    it('warns that the lock did not close, and marks a failed last action', () => {
      const opening = actionOf(1, 'SERVO_OPEN', '2026-11-28T10:42:00Z');
      const closing = actionOf(2, 'SERVO_CLOSE', '2026-11-28T10:44:00Z', 'FAILED');
      const page = render(new Map(), [
        containerSnapshot(ContainerLock.fromActions([opening, closing], true), { lastAction: closing }),
      ]);

      expect(readingOf(page, 'tracking.lock.title')?.querySelector('.failed')?.textContent).toContain(
        'tracking.lock.failed-SERVO_CLOSE',
      );
      expect(readingOf(page, 'tracking.monitoring.last-action')?.querySelector('.failed')?.textContent).toContain(
        'tracking.results.FAILED',
      );
    });

    it('shows no lock summary without containers', () => {
      const page = render(new Map());

      expect(page.querySelector('.lock-summary')).toBeNull();
    });
  });

  describe('live refresh', () => {
    const setHidden = (hidden: boolean) =>
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    });

    afterEach(() => {
      setHidden(false);
      vi.useRealTimers();
    });

    it('reads the devices again every 30 seconds without the loading state', async () => {
      render(new Map(), [containerSnapshot(ContainerLock.fromActions([], true))]);
      await vi.advanceTimersByTimeAsync(0);
      loadSnapshots.mockClear();

      await vi.advanceTimersByTimeAsync(30_000);

      expect(loadSnapshots).toHaveBeenCalledTimes(1);
      expect(loadSnapshots).toHaveBeenCalledWith(true);
    });

    it('does not read while the tab is hidden, and catches up when it comes back', async () => {
      render(new Map(), [containerSnapshot(ContainerLock.fromActions([], true))]);
      await vi.advanceTimersByTimeAsync(0);
      loadSnapshots.mockClear();

      setHidden(true);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(loadSnapshots).not.toHaveBeenCalled();

      setHidden(false);
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);
      expect(loadSnapshots).toHaveBeenCalledWith(true);
    });

    it('stops reading when the view is left', async () => {
      render(new Map(), [containerSnapshot(ContainerLock.fromActions([], true))]);
      await vi.advanceTimersByTimeAsync(0);
      loadSnapshots.mockClear();

      fixture.destroy();
      await vi.advanceTimersByTimeAsync(60_000);

      expect(loadSnapshots).not.toHaveBeenCalled();
    });
  });
});
