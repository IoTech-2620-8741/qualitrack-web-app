import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { provideTranslateService } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';

import { IamStore } from '../../../../iam/application/iam.store';
import {
  UndoToastOpener,
  UndoToastOutcome,
} from '../../../../shared/presentation/components/undo-toast/undo-toast';
import { AlertDevice } from '../../../domain/model/alert-device.entity';
import { AlertEnvironment } from '../../../domain/model/alert-environment.entity';
import {
  AlertSeverity,
  AlertStatus,
  DeviationAlert,
} from '../../../domain/model/deviation-alert.entity';
import { CaApi } from '../../../infrastructure/ca-api';
import { AlertDashboard } from './alert-dashboard';

const alertOf = (
  id: number,
  environmentId: number,
  severity: AlertSeverity,
  status: AlertStatus,
  timestamp: string,
  normalizedAt: string | null = null,
) =>
  new DeviationAlert({
    id,
    environmentId,
    origin: 'ENVIRONMENT',
    equipmentId: id,
    parameterName: 'AIR_QUALITY',
    recordedValue: 951,
    thresholdValue: 900,
    unit: 'ppm',
    timestamp,
    severity,
    status,
    acknowledgedAt: status === 'ACKNOWLEDGED' ? timestamp : null,
    normalizedAt,
  });

const newerCritical = alertOf(1, 1, 'CRITICAL', 'UNRESOLVED', '2026-10-05T10:00:00Z');
const olderCritical = alertOf(2, 2, 'CRITICAL', 'UNRESOLVED', '2026-10-04T10:00:00Z');
const attendedCritical = alertOf(
  3,
  1,
  'CRITICAL',
  'ACKNOWLEDGED',
  '2026-10-03T10:00:00Z',
  '2026-10-06T10:00:00Z',
);
const warning = alertOf(4, 2, 'WARNING', 'UNRESOLVED', '2026-10-01T10:00:00Z');

@Component({ template: '' })
class AlertDetailPage {}

describe('AlertDashboard', () => {
  const api = {
    getAlertEnvironments: vi.fn(),
    getAlertDevices: vi.fn(),
    getEnvironmentAlerts: vi.fn(),
    acknowledgeAlert: vi.fn(),
    getAlertById: vi.fn(),
    sendAlertEmailNotification: vi.fn(),
  };
  const undoToast = { open: vi.fn(), confirmNow: vi.fn() };
  const liveAnnouncer = { announce: vi.fn() };
  const canOperate = signal(true);
  let toastOutcome: Subject<UndoToastOutcome>;

  beforeEach(() => {
    toastOutcome = new Subject();
    canOperate.set(true);
    api.getAlertEnvironments
      .mockReset()
      .mockReturnValue(
        of([
          new AlertEnvironment({ id: 1, code: 'ALM-01', name: 'Almacén', usage: null }),
          new AlertEnvironment({ id: 2, code: 'PROD-01', name: 'Producción', usage: null }),
        ]),
      );
    api.getAlertDevices
      .mockReset()
      .mockReturnValue(
        of(
          [1, 2, 3, 4].map(
            (id) =>
              new AlertDevice({ id, name: id === 2 ? 'Cámara fría' : `Device ${id}` } as never),
          ),
        ),
      );
    answer({ 1: [newerCritical, attendedCritical], 2: [olderCritical, warning] });
    api.acknowledgeAlert.mockReset();
    api.getAlertById.mockReset();
    api.sendAlertEmailNotification.mockReset();
    undoToast.open.mockReset().mockReturnValue(toastOutcome);
    undoToast.confirmNow.mockReset();
    liveAnnouncer.announce.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'alerts', component: AlertDashboard },
          { path: 'alerts/:alertId', component: AlertDetailPage },
        ]),
        provideTranslateService(),
        { provide: CaApi, useValue: api },
        { provide: UndoToastOpener, useValue: undoToast },
        { provide: LiveAnnouncer, useValue: liveAnnouncer },
        {
          provide: IamStore,
          useValue: {
            canOperate,
            currentUserId: signal(27),
            requireLaboratoryId: () => 42,
            beforeSignOut: () => undefined,
          },
        },
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  function answer(alertsByEnvironment: Record<number, DeviationAlert[]>) {
    api.getEnvironmentAlerts
      .mockReset()
      .mockImplementation((_laboratoryId: number, environmentId: number) =>
        alertsByEnvironment[environmentId]
          ? of(alertsByEnvironment[environmentId])
          : throwError(() => new Error('unavailable')),
      );
  }

  async function open(url = '/alerts') {
    const harness = await RouterTestingHarness.create(url);
    await harness.fixture.whenStable();
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    const cardIds = () =>
      Array.from(element.querySelectorAll('app-alert-card h2')).map(
        (title) => title.textContent?.split(' · ')[1],
      );
    const statCard = (label: string) =>
      Array.from(element.querySelectorAll<HTMLButtonElement>('.stat-filter-card')).find((card) =>
        card.textContent?.includes(label),
      )!;
    const press = (target: HTMLElement) => {
      target.click();
      harness.detectChanges();
    };
    return { harness, element, cardIds, statCard, press };
  }

  describe('scope', () => {
    it('opens with the alerts of every environment, the most urgent first', async () => {
      const { cardIds } = await open();

      expect(cardIds()).toEqual(['Cámara fría', 'Device 1', 'Device 3', 'Device 4']);
      expect(api.getEnvironmentAlerts).toHaveBeenCalledTimes(2);
    });

    it('narrows to the environment of the address', async () => {
      const { cardIds } = await open('/alerts?environmentId=1');

      expect(cardIds()).toEqual(['Device 1', 'Device 3']);
      expect(api.getEnvironmentAlerts).toHaveBeenCalledTimes(1);
    });

    it('treats an unknown environment in the address as every environment', async () => {
      const { cardIds } = await open('/alerts?environmentId=99');

      expect(cardIds()).toHaveLength(4);
    });

    it('follows the address when the environment changes', async () => {
      const { harness, cardIds } = await open();

      await TestBed.inject(Router).navigateByUrl('/alerts?environmentId=2');
      await harness.fixture.whenStable();
      harness.detectChanges();

      expect(cardIds()).toEqual(['Cámara fría', 'Device 4']);
    });
  });

  describe('summary and filters', () => {
    it('counts the open alerts of the scope', async () => {
      const { statCard } = await open();

      expect(statCard('ca-alerts.kpi.open').querySelector('.value')?.textContent).toBe('4');
      expect(statCard('ca-alerts.kpi.critical').querySelector('.value')?.textContent).toBe('3');
      expect(
        statCard('ca-alerts.active.stats.unattended').querySelector('.value')?.textContent,
      ).toBe('3');
      expect(statCard('ca-alerts.kpi.attending').querySelector('.value')?.textContent).toBe('1');
    });

    it('filters when a card is pressed and stops when it is pressed again', async () => {
      const { statCard, press, cardIds } = await open();
      const critical = statCard('ca-alerts.kpi.critical');

      press(critical);
      expect(cardIds()).toEqual(['Cámara fría', 'Device 1', 'Device 3']);
      expect(critical.getAttribute('aria-pressed')).toBe('true');
      expect(statCard('ca-alerts.kpi.open').getAttribute('aria-pressed')).toBe('false');

      press(critical);
      expect(cardIds()).toHaveLength(4);
      expect(statCard('ca-alerts.kpi.open').getAttribute('aria-pressed')).toBe('true');
    });

    it('keeps the counts while filtering', async () => {
      const { statCard, press } = await open();

      press(statCard('ca-alerts.kpi.attending'));

      expect(statCard('ca-alerts.kpi.open').querySelector('.value')?.textContent).toBe('4');
    });

    it('shows what the banner warns about', async () => {
      const { element, press, cardIds, statCard } = await open();

      press(element.querySelector<HTMLButtonElement>('app-action-banner button')!);

      expect(cardIds()).toEqual(['Cámara fría', 'Device 1']);
      expect(statCard('ca-alerts.kpi.critical').getAttribute('aria-pressed')).toBe('true');
      expect(statCard('ca-alerts.active.stats.unattended').getAttribute('aria-pressed')).toBe(
        'true',
      );
    });

    it('searches by device without minding accents or capitals', async () => {
      const { harness, element, cardIds } = await open();
      const search = element.querySelector<HTMLInputElement>('input[type="search"]')!;

      search.value = 'CAMARA';
      search.dispatchEvent(new Event('input'));
      harness.detectChanges();

      expect(cardIds()).toEqual(['Cámara fría']);
      expect(element.querySelector('.result-count')?.textContent).toContain(
        'ca-alerts.active.results',
      );
    });

    it('offers to clear the filters when nothing matches', async () => {
      const { harness, element, press, cardIds } = await open();
      const search = element.querySelector<HTMLInputElement>('input[type="search"]')!;
      search.value = 'nothing like this';
      search.dispatchEvent(new Event('input'));
      harness.detectChanges();
      expect(cardIds()).toEqual([]);

      press(element.querySelector<HTMLButtonElement>('app-empty-state button')!);

      expect(cardIds()).toHaveLength(4);
    });

    it('orders by the latest incident when asked to', async () => {
      const { element, press, cardIds } = await open();

      press(element.querySelectorAll<HTMLButtonElement>('.sort-pill')[1]);

      expect(cardIds()).toEqual(['Device 1', 'Cámara fría', 'Device 3', 'Device 4']);
    });
  });

  describe('banner', () => {
    it('names the oldest critical alert nobody attends', async () => {
      const { element } = await open();
      const banner = element.querySelector('app-action-banner');

      expect(banner?.textContent).toContain('ca-alerts.active.critical-banner.title-many');
      expect(banner?.querySelector('[role="alert"]')).not.toBeNull();
    });

    it('does not appear when every critical alert is attended', async () => {
      answer({ 1: [attendedCritical], 2: [warning] });
      const { element } = await open();

      expect(element.querySelector('app-action-banner')).toBeNull();
    });
  });

  describe('empty state', () => {
    it('gives the good news and what to do next', async () => {
      answer({ 1: [], 2: [] });
      const { element } = await open();
      const empty = element.querySelector('app-empty-state');

      expect(empty?.querySelector('h2')?.textContent).toBe('ca-alerts.active.empty.title');
      expect(empty?.querySelector('p')?.textContent).toBe('ca-alerts.active.empty.message-many');
      expect(
        Array.from(empty!.querySelectorAll('a')).map((link) => link.getAttribute('href')),
      ).toEqual(['/alerts/history', '/tracking/monitoring']);
    });

    it('never gives the good news when an environment could not be read', async () => {
      answer({ 1: [] });
      const { element } = await open();

      expect(element.querySelector('app-empty-state')).toBeNull();
      expect(element.querySelector('app-action-banner')?.textContent).toContain(
        'ca-alerts.active.unavailable',
      );
    });
  });

  describe('attention', () => {
    const primaryActionOf = (element: HTMLElement) =>
      element.querySelector<HTMLButtonElement>('app-alert-card button[mat-flat-button]')!;

    it('shows the alert as attended at once and gives time to undo it', async () => {
      const { element, press, statCard } = await open();

      press(primaryActionOf(element));

      expect(statCard('ca-alerts.kpi.attending').querySelector('.value')?.textContent).toBe('2');
      expect(undoToast.open).toHaveBeenCalledWith(
        expect.objectContaining({ messageKey: 'ca-alerts.active.attention-registered' }),
      );
      expect(api.acknowledgeAlert).not.toHaveBeenCalled();
    });

    it('sends nothing when it is undone', async () => {
      const { harness, element, press, statCard } = await open();
      press(primaryActionOf(element));

      toastOutcome.next('undone');
      harness.detectChanges();

      expect(statCard('ca-alerts.kpi.attending').querySelector('.value')?.textContent).toBe('1');
      expect(api.acknowledgeAlert).not.toHaveBeenCalled();
    });

    it('sends it when the time to undo ends', async () => {
      api.acknowledgeAlert.mockReturnValue(
        of(alertOf(2, 2, 'CRITICAL', 'ACKNOWLEDGED', '2026-10-04T10:00:00Z')),
      );
      const { element, press } = await open();
      press(primaryActionOf(element));

      toastOutcome.next('confirmed');

      expect(api.acknowledgeAlert).toHaveBeenCalledWith(2);
    });

    it('sends it even after the person left the view', async () => {
      api.acknowledgeAlert.mockReturnValue(
        of(alertOf(2, 2, 'CRITICAL', 'ACKNOWLEDGED', '2026-10-04T10:00:00Z')),
      );
      const { harness, element, press } = await open();
      press(primaryActionOf(element));

      harness.fixture.destroy();
      toastOutcome.next('confirmed');

      expect(api.acknowledgeAlert).toHaveBeenCalledWith(2);
    });

    it('closes the time to undo when the person opens that alert', async () => {
      const { harness, element, press } = await open();
      press(primaryActionOf(element));
      const card = Array.from(element.querySelectorAll('app-alert-card')).find((item) =>
        item.textContent?.includes('Cámara fría'),
      )!;

      card.querySelector<HTMLAnchorElement>('.actions a')!.click();
      await harness.fixture.whenStable();

      expect(undoToast.confirmNow).toHaveBeenCalledTimes(1);
    });

    it('leaves the time to undo running when the person opens another alert', async () => {
      const { harness, element, press } = await open();
      press(primaryActionOf(element));
      const anotherCard = Array.from(element.querySelectorAll('app-alert-card')).find((item) =>
        item.textContent?.includes('Device 4'),
      )!;

      anotherCard.querySelector<HTMLAnchorElement>('.actions a')!.click();
      await harness.fixture.whenStable();

      expect(undoToast.confirmNow).not.toHaveBeenCalled();
    });

    it('offers nothing but the detail to who cannot attend alerts', async () => {
      canOperate.set(false);
      const { element } = await open();

      expect(primaryActionOf(element)).toBeNull();
      expect(element.querySelectorAll('app-alert-card .actions a')).toHaveLength(4);
    });
  });

  describe('live refresh', () => {
    const setHidden = (hidden: boolean) =>
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });

    afterEach(() => setHidden(false));

    it('reads the alerts again every 30 seconds', async () => {
      vi.useFakeTimers({
        toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'],
      });
      const opened = open();
      await vi.advanceTimersByTimeAsync(100);
      await opened;
      api.getEnvironmentAlerts.mockClear();

      await vi.advanceTimersByTimeAsync(30_000);

      expect(api.getEnvironmentAlerts).toHaveBeenCalledTimes(2);
    });

    it('does not read while the tab is hidden, and catches up when it comes back', async () => {
      vi.useFakeTimers({
        toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'],
      });
      const opened = open();
      await vi.advanceTimersByTimeAsync(100);
      await opened;
      api.getEnvironmentAlerts.mockClear();

      setHidden(true);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(api.getEnvironmentAlerts).not.toHaveBeenCalled();

      setHidden(false);
      document.dispatchEvent(new Event('visibilitychange'));
      expect(api.getEnvironmentAlerts).toHaveBeenCalledTimes(2);
    });

    it('announces the alerts that arrive', async () => {
      const { harness, element, press } = await open();
      answer({
        1: [
          newerCritical,
          attendedCritical,
          alertOf(5, 1, 'WARNING', 'UNRESOLVED', '2026-10-06T10:00:00Z'),
        ],
        2: [olderCritical, warning],
      });

      press(Array.from(element.querySelectorAll<HTMLButtonElement>('.live-status button'))[0]);
      await harness.fixture.whenStable();
      harness.detectChanges();

      expect(liveAnnouncer.announce).toHaveBeenCalledTimes(1);
      expect(element.querySelectorAll('.is-new')).toHaveLength(1);
    });
  });
});
