import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { ProfileStore, StaffProfile } from '../../../../profile/application/profile.store';
import { Profile } from '../../../../profile/domain/model/profile.entity';
import { RaStore } from '../../../../ra/application/ra.store';
import { AuditLogEntry } from '../../../../ra/domain/model/audit-log-entry.entity';
import { LaboratoryStore } from '../../../application/laboratory.store';
import { StaffMember } from '../../../domain/model/staff-member.entity';
import { StaffDetail } from './staff-detail';

describe('StaffDetail', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const params = new BehaviorSubject(convertToParamMap({ staffId: '2' }));
  const activity = signal<AuditLogEntry[]>([]);
  const loadStaffActivity = vi.fn();
  const staffProfile = vi.fn();
  const member = (userId: number | null) =>
    new StaffMember({ id: 2, laboratoryId: 7, fullName: 'Ana Pérez', role: 'Operator', email: 'ana@example.test', active: true, accessRole: 'OPERATOR', userId });
  const profile = new Profile({ userId: 4, staffId: 2, username: 'ana', email: 'ana@example.test', roles: [], fullName: 'Ana Pérez', dni: '76204189', phoneNumber: null, location: null, position: null, hasPhoto: true, photoUpdatedAt: null, updatedAt: null });
  const entry = (id: number, type: string, action: string, daysAgo: number) =>
    new AuditLogEntry({ id, entityType: type, action: action as AuditLogEntry['action'], timestamp: new Date(Date.now() - daysAgo * DAY).toISOString(), entityId: id, performedBy: 1, details: '' });

  function create({ manager = true, userId = 9 as number | null } = {}) {
    TestBed.configureTestingModule({
      imports: [StaffDetail],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: ActivatedRoute, useValue: { paramMap: params } },
        { provide: IamStore, useValue: { canManageQuality: () => manager, requireLaboratoryId: () => 7 } },
        { provide: LaboratoryStore, useValue: { staffMember: () => of(member(userId)) } },
        { provide: ProfileStore, useValue: { staffProfile } },
        {
          provide: RaStore,
          useValue: {
            staffActivity: activity,
            staffActivityLoading: signal(false),
            staffActivityError: signal(null),
            loadStaffActivity,
            clearStaffActivity: vi.fn(),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(StaffDetail);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance, element: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    params.next(convertToParamMap({ staffId: '2' }));
    activity.set([
      entry(4, 'EQUIPMENT', 'UPDATE', 1),
      entry(3, 'BATCH', 'REGISTER', 10),
      entry(2, 'EQUIPMENT', 'REGISTER', 40),
      entry(1, 'BATCH', 'CREATE', 120),
    ]);
    loadStaffActivity.mockClear();
    staffProfile.mockReset().mockReturnValue(of({ profile, photoUrl: 'blob:staff-2' } satisfies StaffProfile));
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it.each([
    { manager: true, userId: 9, showsProfile: true },
    { manager: false, userId: 9, showsProfile: false },
    { manager: true, userId: null, showsProfile: false },
  ])('shows the profile and deactivation only to the quality manager: %j', ({ manager, userId, showsProfile }) => {
    const { element } = create({ manager, userId });
    expect(!!element.querySelector('.profile')).toBe(showsProfile);
    expect(staffProfile).toHaveBeenCalledTimes(showsProfile ? 1 : 0);
    expect(!!element.querySelector('.danger-btn')).toBe(manager);
    // The activity is always on the same page, without links to other pages.
    expect(element.querySelector('.activity')).not.toBeNull();
    expect(element.querySelector('a[href*="/activity"], a[href^="/profile/staff"]')).toBeNull();
  });

  it('shows the profile data and its photo beside the name', () => {
    const { element } = create();
    expect(element.querySelector('.profile')?.textContent).toContain('76204189');
    expect(element.querySelector<HTMLImageElement>('.identity img')?.getAttribute('src')).toBe('blob:staff-2');
  });

  it('says the profile could not be read when it fails', () => {
    staffProfile.mockReturnValue(throwError(() => new Error('unavailable')));
    const { element, page } = create();
    expect(element.textContent).toContain('staff.profile.unavailable');
    expect(page['profileLoading']()).toBe(false);
  });

  it('narrows the activity by period, action and type of record, and clears them together', () => {
    const { fixture, page, element } = create();
    expect(page['actions']()).toEqual(['CREATE', 'REGISTER', 'UPDATE']);
    expect(page['entityTypes']()).toEqual(['BATCH', 'EQUIPMENT']);

    page['period'].set(30);
    expect(page['visibleActivity']().map((e) => e.id)).toEqual([4, 3]);
    page['action'].set('REGISTER');
    expect(page['visibleActivity']().map((e) => e.id)).toEqual([3]);
    page['entityType'].set('EQUIPMENT');
    fixture.detectChanges();
    expect(page['visibleActivity']()).toEqual([]);
    expect(page['activeFilters']()).toBe(3);
    expect(element.textContent).toContain('staff.detail.no-matching');

    element.querySelector<HTMLButtonElement>('.empty-cell button')!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(page['activeFilters']()).toBe(0);
  });

  it('resets the filters, asks for the next member and releases the previous photo when the route changes', () => {
    const { page } = create();
    page['action'].set('CREATE');
    staffProfile.mockReturnValue(of({ profile, photoUrl: 'blob:staff-3' }));
    params.next(convertToParamMap({ staffId: '3' }));
    expect(page['action']()).toBe('ALL');
    expect(loadStaffActivity).toHaveBeenLastCalledWith(3);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:staff-2');
  });

  it('does not replace the current profile with a late response for another member', () => {
    const stale = new Subject<StaffProfile>();
    staffProfile.mockReturnValueOnce(stale);
    const { page } = create();
    params.next(convertToParamMap({ staffId: '3' }));
    stale.next({ profile, photoUrl: 'blob:stale' });
    expect(page['profile']()?.photoUrl).toBe('blob:staff-2');
  });

  it('keeps unknown entities and actions readable and has no last activity for an empty log', () => {
    const { page } = create();
    expect(page['entityKey']('CUSTOM_RECORD')).toBeNull();
    expect(page['actionKey']('CUSTOM_ACTION')).toBeNull();
    activity.set([]);
    expect(page['lastActivity']()).toBeNull();
  });
});
