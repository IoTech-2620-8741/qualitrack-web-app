import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { CaStore } from '../../../application/ca.store';
import { AlertHistory } from './alert-history';

describe('AlertHistory', () => {
  const store = {
    environments: signal([
      { id: 1, code: 'E1', name: 'One' },
      { id: 2, code: 'E2', name: 'Two' },
    ]),
    environmentsEmpty: signal(false),
    alerts: signal([]),
    loading: signal(false),
    error: signal<string | null>(null),
    clearError: vi.fn(),
    clearAlerts: vi.fn(),
    loadDevices: vi.fn(),
    loadEnvironments: vi.fn(),
    loadEnvironmentAlerts: vi.fn(),
    rememberEnvironment: vi.fn(),
    preferredEnvironmentId: vi.fn(() => 1),
    deviceName: () => null,
  };

  async function open(url: string): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        { provide: CaStore, useValue: store },
        provideTranslateService(),
        provideRouter([{ path: 'alerts/history', component: AlertHistory }]),
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, AlertHistory);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  const activeTabOf = (page: HTMLElement) => page.querySelector('a[mat-tab-link]')?.getAttribute('href');

  beforeEach(() => vi.clearAllMocks());

  it('reads the environments again, because one can have been created', async () => {
    await open('/alerts/history');
    expect(store.loadEnvironments).toHaveBeenCalledTimes(1);
  });

  it('shows the environment in the address and carries it to the active alerts', async () => {
    const page = await open('/alerts/history?environmentId=2');
    expect(store.loadEnvironmentAlerts).toHaveBeenCalledWith(2, expect.anything());
    expect(activeTabOf(page)).toBe('/alerts?environmentId=2');
  });

  it('uses the preferred environment without choosing it for the active alerts', async () => {
    const page = await open('/alerts/history');
    expect(store.loadEnvironmentAlerts).toHaveBeenCalledWith(1, expect.anything());
    expect(activeTabOf(page)).toBe('/alerts');
  });

  it('ignores an environment of the address that does not exist', async () => {
    await open('/alerts/history?environmentId=99');
    expect(store.loadEnvironmentAlerts).toHaveBeenCalledWith(1, expect.anything());
  });

  it('marks the history as the current section', async () => {
    const page = await open('/alerts/history');
    const tabs = [...page.querySelectorAll('a[mat-tab-link]')];
    expect(tabs[1].classList.contains('mdc-tab--active')).toBe(true);
  });
});
