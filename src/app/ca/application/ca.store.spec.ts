import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { AlertEnvironment } from '../domain/model/alert-environment.entity';
import { AlertStatus, DeviationAlert } from '../domain/model/deviation-alert.entity';
import { CaApi } from '../infrastructure/ca-api';
import { CaStore } from './ca.store';

const alertOf = (id: number, environmentId: number, status: AlertStatus = 'UNRESOLVED') =>
  new DeviationAlert({
    id,
    environmentId,
    equipmentId: 1,
    parameterName: 'TEMPERATURE',
    recordedValue: 10,
    thresholdValue: 8,
    unit: '°C',
    timestamp: '2026-10-01T10:00:00Z',
    severity: 'CRITICAL',
    status,
  });

const environmentOf = (id: number) =>
  new AlertEnvironment({ id, code: `ENV-${id}`, name: `Environment ${id}`, usage: null });

describe('CaStore', () => {
  const api = {
    getAlertEnvironments: vi.fn(),
    getEnvironmentAlerts: vi.fn(),
    acknowledgeAlert: vi.fn(),
    getAlertById: vi.fn(),
    sendAlertEmailNotification: vi.fn(),
  };

  beforeEach(() => {
    api.getAlertEnvironments.mockReset().mockReturnValue(of([environmentOf(1), environmentOf(2)]));
    api.getEnvironmentAlerts.mockReset().mockReturnValue(of([]));
    api.acknowledgeAlert.mockReset();
    api.getAlertById.mockReset();
    api.sendAlertEmailNotification.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: CaApi, useValue: api },
        {
          provide: IamStore,
          useValue: {
            canOperate: signal(true),
            currentUserId: signal(27),
            requireLaboratoryId: () => 42,
          },
        },
      ],
    });
  });

  async function storeWithEnvironments() {
    const store = TestBed.inject(CaStore);
    await store.loadEnvironments();
    return store;
  }

  /** Answers each environment with its own alerts; a missing environment fails. */
  function answer(alertsByEnvironment: Record<number, DeviationAlert[]>) {
    api.getEnvironmentAlerts.mockImplementation((_laboratoryId: number, environmentId: number) =>
      alertsByEnvironment[environmentId]
        ? of(alertsByEnvironment[environmentId])
        : throwError(() => new Error('unavailable')),
    );
  }

  describe('open alerts', () => {
    it('joins the open alerts of every environment', async () => {
      answer({ 1: [alertOf(10, 1)], 2: [alertOf(20, 2)] });
      const store = await storeWithEnvironments();

      store.loadOpenAlerts(null);

      expect(store.alerts().map((alert) => alert.id)).toEqual([10, 20]);
      expect(api.getEnvironmentAlerts).toHaveBeenCalledWith(42, 1, { active: true });
      expect(api.getEnvironmentAlerts).toHaveBeenCalledWith(42, 2, { active: true });
      expect(store.loading()).toBe(false);
      expect(store.alertsUpdatedAt()).not.toBeNull();
    });

    it('reads only the chosen environment', async () => {
      answer({ 2: [alertOf(20, 2)] });
      const store = await storeWithEnvironments();

      store.loadOpenAlerts(2);

      expect(store.alerts().map((alert) => alert.id)).toEqual([20]);
      expect(api.getEnvironmentAlerts).toHaveBeenCalledTimes(1);
    });

    it('names the environment that failed without hiding the alerts of the others', async () => {
      answer({ 1: [alertOf(10, 1)] });
      const store = await storeWithEnvironments();

      store.loadOpenAlerts(null);

      expect(store.alerts().map((alert) => alert.id)).toEqual([10]);
      expect(store.unavailableEnvironmentIds()).toEqual([2]);
    });

    it('does not claim to be updated when no environment answered', async () => {
      answer({});
      const store = await storeWithEnvironments();

      store.loadOpenAlerts(null);

      expect(store.unavailableEnvironmentIds()).toEqual([1, 2]);
      expect(store.alertsUpdatedAt()).toBeNull();
    });

    it('finishes loading when the laboratory has no environments', async () => {
      api.getAlertEnvironments.mockReturnValue(of([]));
      const store = await storeWithEnvironments();

      store.loadOpenAlerts(null);

      expect(store.alerts()).toEqual([]);
      expect(store.loading()).toBe(false);
    });

    it('ignores the answer of the environment left behind', async () => {
      const stale = new Subject<DeviationAlert[]>();
      api.getEnvironmentAlerts.mockReturnValueOnce(stale).mockReturnValue(of([alertOf(20, 2)]));
      const store = await storeWithEnvironments();

      store.loadOpenAlerts(1);
      store.loadOpenAlerts(2);
      stale.next([alertOf(10, 1)]);
      stale.complete();

      expect(store.alerts().map((alert) => alert.id)).toEqual([20]);
    });
  });
});
