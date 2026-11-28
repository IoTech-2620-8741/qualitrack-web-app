import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { IamStore } from '../../iam/application/iam.store';
import { Equipment } from '../domain/model/equipment.entity';
import { EquipmentStore, equipmentError } from './equipment.store';

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

  /** Process equipment without telemetry, as the API returns it. */
  const autoclave = {
    id: 6,
    laboratoryId: 42,
    environmentId: 2,
    name: 'Autoclave AV-200',
    type: 'Autoclave',
    model: 'Tuttnauer 3870EL',
    serialNumber: 'TT-3870-1182',
    status: 'OPERATIONAL',
    deviceType: null,
    sensorExternalId: null,
    firmwareVersion: null,
    createdAt: '2026-09-01T10:00:00Z',
  };

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

  it('drops the error of an earlier profile load that fails late', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { store, http } = setUp();
    const first = store.loadMonitoringProfile(container(3));
    const second = store.loadMonitoringProfile(container(4));

    http.expectOne((request) => request.url.endsWith('/container-monitors/4/environmental-profile')).flush(profile(2));
    await second;
    http.expectOne((request) => request.url.endsWith('/container-monitors/3/environmental-profile'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    await first;

    expect(store.error()).toBeNull();
    expect(store.monitoringProfile()?.version).toBe(2);
  });

  it('drops a late profile error once another equipment is opened', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { store, http } = setUp();
    const late = store.loadMonitoringProfile(container(3));
    const opening = store.loadEquipmentById(6);
    http.expectOne((request) => request.url.endsWith('/equipments/6')).flush(autoclave);
    await opening;

    http.expectOne((request) => request.url.endsWith('/container-monitors/3/environmental-profile'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    await late;

    expect(store.error()).toBeNull();
    expect(store.monitoringProfileLoading()).toBe(false);
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

describe('equipmentError', () => {
  const conflict = (message: string) =>
    new HttpErrorResponse({ status: 409, error: { code: 'CONFLICT', message } });

  it('tells in the language of the page that the plan allows no more IoT devices', () => {
    expect(equipmentError(conflict('The plan of the laboratory allows 5 IoT devices and 5 are already registered'))).toBe(
      'equipment.errors.plan-limit',
    );
  });

  it('keeps the message of the platform for other conflicts', () => {
    expect(equipmentError(conflict("Device with identifier 'CNT-1' already exists"))).toBe(
      "Device with identifier 'CNT-1' already exists",
    );
  });
});
