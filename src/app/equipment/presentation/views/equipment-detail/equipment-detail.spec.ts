import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { EquipmentDetail } from './equipment-detail';

describe('EquipmentDetail', () => {
  /** An Edge Gateway located in an environment and operational. */
  const gateway = {
    id: 5,
    laboratoryId: 42,
    environmentId: 1,
    name: 'Edge Gateway almacén',
    type: 'EDGE_GATEWAY',
    model: 'Raspberry Pi 4',
    serialNumber: 'RPI-0001',
    status: 'OPERATIONAL',
    deviceType: null,
    sensorExternalId: 'EDGE-001',
    firmwareVersion: null,
    createdAt: '2026-11-01T10:00:00Z',
  };

  /** A container monitor located in environment 1, as Contenedor MP-A1 in production. */
  const containerMonitor = {
    id: 5,
    laboratoryId: 42,
    environmentId: 1 as number | null,
    name: 'Contenedor MP-A1',
    type: 'CONTAINER_MONITOR',
    model: 'ESP32-S3 + SHT31 + BH1750 + RC522',
    serialNumber: 'SN-CTN-24011',
    status: 'OPERATIONAL',
    deviceType: 'CONTAINER_MONITOR',
    sensorExternalId: 'ESP32-CTN-MPA1',
    firmwareVersion: '2.1.0',
    createdAt: '2026-09-01T10:00:00Z',
  };

  /** The environmental device of environment 1, as Monitor ambiental ALM-MP in production. */
  const environmentalDevice = {
    ...containerMonitor,
    name: 'Monitor ambiental ALM-MP',
    type: 'ENVIRONMENTAL_DEVICE',
    model: 'ESP32-WROOM-32 + MQ-135 + HC-SR501',
    serialNumber: 'SN-ENV-24001',
    deviceType: 'ENVIRONMENTAL_DEVICE',
    sensorExternalId: 'ESP32-ENV-ALMMP',
  };

  /** Process equipment without telemetry, as Autoclave AV-200 in production. */
  const autoclave = {
    ...gateway,
    name: 'Autoclave AV-200',
    type: 'Autoclave',
    model: 'Tuttnauer 3870EL',
    serialNumber: 'TT-3870-1182',
    sensorExternalId: null,
  };

  /** Environmental profile as Tracking returns it, with the given thresholds. */
  const profileWith = (scope: 'ENVIRONMENT' | 'CONTAINER_MONITOR', thresholds: object[]) => ({
    id: 4,
    scope,
    laboratoryId: 42,
    environmentId: 1,
    deviceId: scope === 'CONTAINER_MONITOR' ? 5 : null,
    version: 2,
    thresholds,
    actuationRules: [],
    updatedAt: '2026-09-12T09:00:00Z',
    updatedBy: 27,
  });

  const temperature = { metric: 'TEMPERATURE', unit: '°C', normalMin: 15, normalMax: 25, criticalMin: 10, criticalMax: 30 };

  afterEach(() => localStorage.clear());

  /**
   * Opens the detail of an equipment with a session of the given role and answers what it reads; an IoT device gets
   * the given environmental profile, a 404 when it is `null`, a 500 with `'failure'`, or no answer with `'pending'`.
   */
  async function open(role: string, equipment: object = gateway, profile: object | null | 'pending' | 'failure' = null) {
    localStorage.setItem('token', 'test.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.test');
    localStorage.setItem('userId', '27');
    localStorage.setItem('username', 'Detail fixture');
    localStorage.setItem('roles', JSON.stringify([role]));
    localStorage.setItem('laboratoryId', '42');
    TestBed.configureTestingModule({
      imports: [EquipmentDetail],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ equipmentId: '5' }) } } },
      ],
    });
    // The laboratory comes from the onboarding check, which the page does not run.
    vi.spyOn(TestBed.inject(IamStore), 'requireLaboratoryId').mockReturnValue(42);
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(EquipmentDetail);
    fixture.detectChanges();
    const keyRequests: string[] = [];
    const urls: string[] = [];
    // Answers every request until the page stops asking, keeping the ones for the API key.
    const answer = async () => {
      for (let round = 0; round < 5; round++) {
        for (const request of http.match(() => true)) {
          const url = request.request.urlWithParams;
          urls.push(url);
          if (url.endsWith('/api-key')) {
            keyRequests.push(url);
            request.flush({ issued: false });
          } else if (url.endsWith('/equipments/5')) {
            request.flush(equipment);
          } else if (url.endsWith('/environmental-profile')) {
            // A 'pending' profile request is taken off the open list without an answer, so it stays in flight.
            if (profile === 'failure') request.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });
            else if (profile === 'pending') continue;
            else if (profile) request.flush(profile);
            else request.flush({ message: 'Profile not found' }, { status: 404, statusText: 'Not Found' });
          } else {
            request.flush([]);
          }
        }
        await fixture.whenStable();
        fixture.detectChanges();
      }
    };
    await answer();
    return { element: fixture.nativeElement as HTMLElement, keyRequests, urls, answer, fixture, http };
  }

  /** Opens the tab whose label carries the given translation key. */
  async function openTab(fixture: ComponentFixture<EquipmentDetail>, key: string) {
    const element = fixture.nativeElement as HTMLElement;
    const tab = [...element.querySelectorAll<HTMLElement>('[role="tab"]')].find((label) => label.textContent?.includes(key));
    expect(tab).toBeDefined();
    tab!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const tabLabels = (element: HTMLElement) =>
    [...element.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent ?? '');

  const cells = (element: HTMLElement) =>
    [...element.querySelectorAll('table.data-table tbody td')].map((cell) => (cell.textContent ?? '').replace(/\s+/g, ' ').trim());

  it('reads and shows the API key status to a quality manager', async () => {
    const { element, keyRequests } = await open('ROLE_QA_MANAGER');
    expect(keyRequests).toHaveLength(1);
    expect(element.textContent).toContain('edge-gateway.api-key.title');
    expect(element.textContent).toContain('edge-gateway.api-key.generate');
  });

  it.each(['ROLE_OPERATOR', 'ROLE_AUDITOR'])('neither asks nor shows the API key to %s', async (role) => {
    const { element, keyRequests } = await open(role);
    expect(element.textContent).toContain('Edge Gateway almacén');
    expect(keyRequests).toEqual([]);
    expect(element.textContent).not.toContain('edge-gateway.api-key.title');
  });

  it('starts the location form on the environment where the equipment is', async () => {
    const { fixture } = await open('ROLE_QA_MANAGER');
    const component = fixture.componentInstance as unknown as { locationForm: import('@angular/forms').FormGroup };
    expect(component.locationForm.value).toEqual({ environmentId: 1 });
  });

  it('says what is missing on Move and Register change instead of disabling them', async () => {
    const { element, fixture, http } = await open('ROLE_QA_MANAGER');
    const [move, register] = [...element.querySelectorAll<HTMLButtonElement>('form.inline-form button[type="submit"]')];
    expect(move.disabled).toBe(false);
    expect(register.disabled).toBe(false);
    move.click();
    register.click();
    fixture.detectChanges();

    expect(element.textContent).toContain('equipment-detail.location.unchanged');
    expect(element.textContent).toContain('equipment-detail.status-change.choose');
    expect(http.match((request) => request.method !== 'GET')).toEqual([]);
  });

  it('shows the profile thresholds of a container monitor instead of BPM limits', async () => {
    const { element, urls, fixture } = await open('ROLE_QA_MANAGER', containerMonitor, profileWith('CONTAINER_MONITOR', [temperature]));
    expect(urls.some((url) => url.endsWith('/environments/1/container-monitors/5/environmental-profile'))).toBe(true);
    expect(urls.some((url) => url.includes('/bpm-configs'))).toBe(false);
    expect(tabLabels(element).some((label) => label.includes('equipment-detail.tabs.bpm'))).toBe(false);

    await openTab(fixture, 'equipment-detail.tabs.thresholds');

    expect(cells(element)).toEqual(['tracking.metrics.TEMPERATURE (°C)', '10', '15', '25', '30']);
    expect(element.querySelector('a[href^="/tracking/profiles"]')?.getAttribute('href')).toBe('/tracking/profiles?environmentId=1');
  });

  it('reads an environmental device profile and leaves its missing minimums empty', async () => {
    const airQuality = { metric: 'AIR_QUALITY', unit: 'ppm', normalMin: null, normalMax: 600, criticalMin: null, criticalMax: 900 };
    const { element, urls, fixture } = await open('ROLE_QA_MANAGER', environmentalDevice, profileWith('ENVIRONMENT', [airQuality]));
    expect(urls.some((url) => url.endsWith('/laboratories/42/environments/1/environmental-profile'))).toBe(true);

    await openTab(fixture, 'equipment-detail.tabs.thresholds');

    expect(cells(element)).toEqual(['tracking.metrics.AIR_QUALITY (ppm)', '—', '—', '600', '900']);
  });

  it('says the thresholds are not configured when the device has no profile', async () => {
    const { element, fixture } = await open('ROLE_QA_MANAGER', containerMonitor, null);

    await openTab(fixture, 'equipment-detail.tabs.thresholds');

    expect(element.textContent).toContain('tracking.profiles.not-configured');
    expect(element.querySelector('.error')).toBeNull();
  });

  it('says the thresholds are loading instead of not configured while the profile is read', async () => {
    const { element, fixture } = await open('ROLE_QA_MANAGER', containerMonitor, 'pending');

    await openTab(fixture, 'equipment-detail.tabs.thresholds');

    expect(element.textContent).toContain('common.status-loading');
    expect(element.textContent).not.toContain('tracking.profiles.not-configured');
  });

  it('does not call the thresholds not configured when the profile cannot be read', async () => {
    const { element, fixture } = await open('ROLE_QA_MANAGER', containerMonitor, 'failure');

    await openTab(fixture, 'equipment-detail.tabs.thresholds');

    expect(element.querySelector('.error')).not.toBeNull();
    expect(element.textContent).not.toContain('tracking.profiles.not-configured');
    expect(element.textContent).not.toContain('common.status-loading');
  });

  it('asks to locate an IoT device before reading its thresholds', async () => {
    const unlocated = { ...containerMonitor, environmentId: null };
    const { element, urls, fixture } = await open('ROLE_QA_MANAGER', unlocated, profileWith('CONTAINER_MONITOR', [temperature]));
    expect(urls.some((url) => url.endsWith('/environmental-profile'))).toBe(false);

    await openTab(fixture, 'equipment-detail.tabs.thresholds');

    expect(element.textContent).toContain('equipment-detail.thresholds.requires-location');
  });

  it('keeps the BPM limits of process equipment', async () => {
    const { element, urls } = await open('ROLE_QA_MANAGER', autoclave);
    expect(urls.some((url) => url.endsWith('/equipments/5/bpm-configs'))).toBe(true);
    expect(urls.some((url) => url.endsWith('/environmental-profile'))).toBe(false);
    expect(tabLabels(element).some((label) => label.includes('equipment-detail.tabs.bpm'))).toBe(true);
  });

  it('reloads the thresholds after locating the device', async () => {
    const unlocated = { ...containerMonitor, environmentId: null };
    const { element, urls, answer, fixture, http } =
      await open('ROLE_QA_MANAGER', unlocated, profileWith('CONTAINER_MONITOR', [temperature]));
    const component = fixture.componentInstance as unknown as {
      locationForm: import('@angular/forms').FormGroup;
      equipment(): unknown;
      onLocate(equipment: unknown): Promise<void>;
    };

    component.locationForm.setValue({ environmentId: 1 });
    const locating = component.onLocate(component.equipment());
    http.expectOne((request) => request.method === 'POST').flush(containerMonitor);
    await answer();
    await locating;

    expect(urls.some((url) => url.endsWith('/environments/1/container-monitors/5/environmental-profile'))).toBe(true);
    await openTab(fixture, 'equipment-detail.tabs.thresholds');
    expect(cells(element)).toEqual(['tracking.metrics.TEMPERATURE (°C)', '10', '15', '25', '30']);
  });

  it('reads the thresholds of the new environment as soon as the device moves', async () => {
    const coldRoom = { ...temperature, normalMin: 2, normalMax: 8, criticalMin: 0, criticalMax: 10 };
    const { element, answer, fixture, http } =
      await open('ROLE_QA_MANAGER', containerMonitor, profileWith('CONTAINER_MONITOR', [temperature]));
    const component = fixture.componentInstance as unknown as {
      locationForm: import('@angular/forms').FormGroup;
      equipment(): unknown;
      onLocate(equipment: unknown): Promise<void>;
    };
    await openTab(fixture, 'equipment-detail.tabs.thresholds');

    component.locationForm.setValue({ environmentId: 2 });
    const moving = component.onLocate(component.equipment());
    http.expectOne((request) => request.method === 'POST').flush({ ...containerMonitor, environmentId: 2 });
    // Lets the move go on until it waits for the maintenance history
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    expect(cells(element)).toEqual([]);
    expect(element.textContent).toContain('common.status-loading');
    http.expectOne((request) => request.url.endsWith('/environments/2/container-monitors/5/environmental-profile'))
      .flush(profileWith('CONTAINER_MONITOR', [coldRoom]));
    await answer();
    await moving;

    expect(cells(element)).toEqual(['tracking.metrics.TEMPERATURE (°C)', '0', '2', '8', '10']);
    expect(element.querySelector('a[href^="/tracking/profiles"]')?.getAttribute('href')).toBe('/tracking/profiles?environmentId=2');
  });
});
