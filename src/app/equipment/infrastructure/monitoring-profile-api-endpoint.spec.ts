import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { MonitoringProfileApiEndpoint } from './monitoring-profile-api-endpoint';

describe('MonitoringProfileApiEndpoint', () => {
  const resource = {
    id: 4,
    version: 2,
    updatedAt: '2026-09-12T09:00:00Z',
    thresholds: [{ metric: 'TEMPERATURE', unit: '°C', normalMin: 15, normalMax: 25, criticalMin: 10, criticalMax: 30 }],
  };

  function setUp() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    return {
      endpoint: new MonitoringProfileApiEndpoint(TestBed.inject(HttpClient)),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('reads a container monitor profile under its environment', async () => {
    const { endpoint, http } = setUp();
    const profile = firstValueFrom(endpoint.getProfile(42, 1, 'CONTAINER_MONITOR', 3));

    http
      .expectOne((request) => request.method === 'GET'
        && request.url.endsWith('/laboratories/42/environments/1/container-monitors/3/environmental-profile'))
      .flush(resource);

    expect((await profile)?.version).toBe(2);
  });

  it('reads an environmental device profile from its environment', async () => {
    const { endpoint, http } = setUp();
    const profile = firstValueFrom(endpoint.getProfile(42, 1, 'ENVIRONMENTAL_DEVICE', 1));

    http
      .expectOne((request) => request.url.endsWith('/laboratories/42/environments/1/environmental-profile'))
      .flush(resource);

    expect((await profile)?.thresholds[0].criticalMax).toBe(30);
  });

  it('answers null when the device has no profile', async () => {
    const { endpoint, http } = setUp();
    const profile = firstValueFrom(endpoint.getProfile(42, 1, 'CONTAINER_MONITOR', 3));

    http
      .expectOne((request) => request.url.endsWith('/environmental-profile'))
      .flush({ message: 'Profile not found' }, { status: 404, statusText: 'Not Found' });

    expect(await profile).toBeNull();
  });

  it('reports a server failure instead of answering that there is no profile', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { endpoint, http } = setUp();
    const profile = firstValueFrom(endpoint.getProfile(42, 1, 'CONTAINER_MONITOR', 3));

    http
      .expectOne((request) => request.url.endsWith('/environmental-profile'))
      .flush(null, { status: 500, statusText: 'Server Error' });

    await expect(profile).rejects.toBeDefined();
  });
});
