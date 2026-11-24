import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { IamStore } from '../../iam/application/iam.store';
import { Equipment } from '../domain/model/equipment.entity';
import { EquipmentStore } from './equipment.store';

describe('EquipmentStore', () => {
  /** A container monitor located in environment 1. */
  const container = (id: number) =>
    new Equipment({
      id,
      labId: 42,
      environmentId: 1,
      name: `Contenedor ${id}`,
      type: 'IOT_DEVICE',
      model: 'ESP32-S3 + SHT31 + BH1750 + RC522',
      serialNumber: `SN-CTN-${id}`,
      status: 'OPERATIONAL',
      deviceType: 'CONTAINER_MONITOR',
      sensorExternalId: `ESP32-CTN-${id}`,
      firmwareVersion: '2.1.0',
      createdAt: '2026-09-01T10:00:00Z',
    });

  const profile = (version: number) => ({ id: 9, version, updatedAt: null, thresholds: [] });

  /** A BPM limit of an equipment, as the API returns it. */
  const bpmLimit = (equipmentId: number) =>
    ({ id: 1, equipmentId, parameterName: 'Presión', minValue: 1, maxValue: 2.2, unit: 'bar', createdAt: '2026-09-01T10:00:00Z' });

  function setUp() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    vi.spyOn(TestBed.inject(IamStore), 'requireLaboratoryId').mockReturnValue(42);
    return { store: TestBed.inject(EquipmentStore), http: TestBed.inject(HttpTestingController) };
  }

  it('keeps the latest profile when an earlier one answers late', async () => {
    const { store, http } = setUp();
    const first = store.loadMonitoringProfile(container(3));
    const second = store.loadMonitoringProfile(container(4));

    http.expectOne((request) => request.url.endsWith('/container-monitors/4/environmental-profile')).flush(profile(2));
    await second;
    http.expectOne((request) => request.url.endsWith('/container-monitors/3/environmental-profile')).flush(profile(1));
    await first;

    expect(store.monitoringProfile()?.version).toBe(2);
  });

  it('forgets the BPM limits of the previous equipment while the next ones load', () => {
    const { store, http } = setUp();
    store.loadBpmConfig(5);
    http.expectOne((request) => request.url.endsWith('/equipments/5/bpm-configs')).flush([bpmLimit(5)]);
    expect(store.bpmConfigs()).toHaveLength(1);

    store.loadBpmConfig(6);

    expect(store.bpmConfigs()).toEqual([]);
  });
});
