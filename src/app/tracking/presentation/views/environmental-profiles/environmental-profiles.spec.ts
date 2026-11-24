import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { TrackingStore } from '../../../application/tracking.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { EnvironmentalProfiles } from './environmental-profiles';

describe('EnvironmentalProfiles', () => {
  const selectEnvironment = vi.fn().mockResolvedValue(undefined);

  function create(linkedEnvironmentId: string | null) {
    TestBed.configureTestingModule({
      imports: [EnvironmentalProfiles],
      providers: [
        { provide: IamStore, useValue: { canManageQuality: () => true, requireLaboratoryId: () => 1 } },
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: (key: string) => (key === 'environmentId' ? linkedEnvironmentId : null) } },
          },
        },
      ],
    });
    const store = TestBed.inject(TrackingStore);
    vi.spyOn(store, 'loadEnvironments').mockResolvedValue(undefined);
    vi.spyOn(store, 'environments').mockReturnValue([{ id: 1 }, { id: 6 }] as never);
    vi.spyOn(store, 'selectEnvironment').mockImplementation(selectEnvironment);
    vi.spyOn(store, 'loadProfiles').mockResolvedValue(undefined);
    vi.spyOn(store, 'rememberEnvironment').mockImplementation(() => undefined);
    vi.spyOn(store, 'clearMessages').mockImplementation(() => undefined);
    return TestBed.createComponent(EnvironmentalProfiles).componentInstance;
  }

  beforeEach(() => selectEnvironment.mockClear());

  it('opens the environment given in the link', async () => {
    await create('6').ngOnInit();
    expect(selectEnvironment).toHaveBeenCalledWith(6);
  });

  it('ignores a linked environment outside the laboratory', async () => {
    await create('99').ngOnInit();
    expect(selectEnvironment).not.toHaveBeenCalledWith(99);
  });
});
