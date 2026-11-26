import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { TrackingStore } from '../../../application/tracking.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { MonitoredDevice } from '../../../domain/model/monitored-device.entity';
import { EnvironmentalMonitoring } from './environmental-monitoring';

describe('EnvironmentalMonitoring', () => {
  const environmentalDevice = new MonitoredDevice({
    id: 7,
    name: 'ENV-001',
    deviceType: 'ENVIRONMENTAL_DEVICE',
    environmentId: 1,
  });

  const containerMonitor = new MonitoredDevice({ id: 9, name: 'CNT-001', deviceType: 'CONTAINER_MONITOR', environmentId: 1 });

  function render(readings: Map<string, unknown>, containerSnapshot: unknown = null) {
    const snapshot = { device: environmentalDevice, readings, lastMotion: null, lastAction: null, connection: null, failed: false };
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
            snapshots: signal(containerSnapshot ? [snapshot, containerSnapshot] : [snapshot]),
            environmentalDevice: signal(environmentalDevice),
            containerMonitors: signal(containerSnapshot ? [containerMonitor] : []),
            preferredEnvironmentId: () => 1,
            loadEnvironments: () => Promise.resolve(),
            rememberEnvironment: () => undefined,
            selectEnvironment: () => Promise.resolve(),
            loadSnapshots: () => Promise.resolve(),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(EnvironmentalMonitoring);
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

  it('keeps the readings, the RFID tag and the last action of a container in one row of readings', () => {
    const measuredAt = '2026-11-26T05:00:00Z';
    const page = render(new Map(), {
      device: containerMonitor,
      readings: new Map([
        ['TEMPERATURE', { metric: 'TEMPERATURE', value: 26.4, unit: '°C', state: 'WARNING', measuredAt }],
        ['HUMIDITY', { metric: 'HUMIDITY', value: 45, unit: '%RH', state: 'NORMAL', measuredAt }],
        ['RFID_TAG', { metric: 'RFID_TAG', value: null, textValue: 'DE:AD:BE:EF', unit: 'tag', state: null, measuredAt }],
      ]),
      lastMotion: null,
      lastAction: { action: 'VENTILATION_ON', triggerMetric: 'TEMPERATURE', triggerState: 'WARNING', occurredAt: measuredAt },
      connection: null,
      failed: false,
    });

    const container = page.querySelectorAll<HTMLElement>('.device-list .device-card');
    expect(container.length).toBe(1);
    const labels = Array.from(container[0].querySelectorAll('.readings > .reading .label')).map((label) => label.textContent?.trim());
    expect(labels).toEqual([
      'tracking.metrics.TEMPERATURE',
      'tracking.metrics.HUMIDITY',
      'tracking.metrics.LUMINOSITY',
      'tracking.metrics.RFID_TAG',
      'tracking.monitoring.last-action',
    ]);
    // The condition of a reading sits next to its metric
    expect(readingOf(page, 'tracking.metrics.TEMPERATURE')?.querySelector('.reading-head .state')?.textContent).toContain(
      'tracking.states.WARNING',
    );
    expect(readingOf(page, 'tracking.metrics.RFID_TAG')?.querySelector('.tag')?.textContent).toContain('DE:AD:BE:EF');
  });
});
