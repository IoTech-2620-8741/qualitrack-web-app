import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { LaboratoryStore, StaffProfile } from '../../../application/laboratory.store';
import { StaffMember } from '../../../domain/model/staff-member.entity';
import { StaffMemberProfile } from '../../../domain/model/staff-member-profile.entity';
import { StaffActivityEntry } from '../../../domain/model/staff-activity-entry.entity';
import { StaffDetail } from './staff-detail';

describe('StaffDetail', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const params = new BehaviorSubject(convertToParamMap({ staffId: '2' }));
  let activity: StaffActivityEntry[] = [];
  const staffActivity = vi.fn();
  const staffProfile = vi.fn();
  const member = (userId: number | null) =>
    new StaffMember({ id: 2, laboratoryId: 7, fullName: 'Ana Pérez', role: 'Operator', email: 'ana@example.test', active: true, accessRole: 'OPERATOR', userId });
  const profile = new StaffMemberProfile({ id: 2, username: 'ana', email: 'ana@example.test', fullName: 'Ana Pérez', dni: '76204189', phoneNumber: null, location: null, hasPhoto: true, updatedAt: null });
  const entry = (id: number, type: string, action: string, daysAgo: number) =>
    new StaffActivityEntry({ id, entityType: type, action, timestamp: new Date(Date.now() - daysAgo * DAY).toISOString(), entityId: id });

  function create({ manager = true, userId = 9 as number | null } = {}) {
    TestBed.configureTestingModule({
      imports: [StaffDetail],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: ActivatedRoute, useValue: { paramMap: params } },
        { provide: IamStore, useValue: { canManageQuality: () => manager, requireLaboratoryId: () => 7 } },
        { provide: LaboratoryStore, useValue: { staffMember: () => of(member(userId)), staffProfile, staffActivity } },
      ],
    });
    const fixture = TestBed.createComponent(StaffDetail);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance, element: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    params.next(convertToParamMap({ staffId: '2' }));
    activity = [
      entry(4, 'EQUIPMENT', 'UPDATE', 1),
      entry(3, 'BATCH', 'REGISTER', 10),
      entry(2, 'EQUIPMENT', 'REGISTER', 40),
      entry(1, 'BATCH', 'CREATE', 120),
    ];
    staffActivity.mockReset().mockImplementation(() => of(activity));
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
    expect(staffActivity).toHaveBeenLastCalledWith(7, 3);
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
    activity = [];
    const { page, element } = create();
    expect(page['entityKey']('CUSTOM_RECORD')).toBeNull();
    expect(page['actionKey']('CUSTOM_ACTION')).toBeNull();
    expect(page['lastActivity']()).toBeNull();
    expect(element.textContent).toContain('staff.detail.no-activity');
  });

  it('says the activity could not be read when it fails', () => {
    staffActivity.mockReturnValue(throwError(() => new Error('unavailable')));
    const { page, element } = create();
    expect(page['activityError']()).toBe('staff.detail.load-error');
    expect(page['activityLoading']()).toBe(false);
    expect(element.querySelector('.activity .error')).not.toBeNull();
  });

  it('does not show the activity of the previous member when it answers late', () => {
    const stale = new Subject<StaffActivityEntry[]>();
    staffActivity.mockReturnValueOnce(stale);
    const { page } = create();
    params.next(convertToParamMap({ staffId: '3' }));
    stale.next([entry(9, 'BATCH', 'CREATE', 1)]);
    expect(page['activity']().map((e) => e.id)).toEqual([4, 3, 2, 1]);
  });

  it('asks for no activity of an invalid member', () => {
    params.next(convertToParamMap({ staffId: 'abc' }));
    const { page } = create();
    expect(staffActivity).not.toHaveBeenCalled();
    expect(page['activityError']()).toBe('staff.detail.load-error');
  });
});
