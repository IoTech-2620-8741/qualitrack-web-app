import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { LaboratoryApi } from '../infrastructure/laboratory-api';
import { StaffMemberProfile } from '../domain/model/staff-member-profile.entity';
import { StaffActivityEntry } from '../domain/model/staff-activity-entry.entity';
import { LaboratoryStore } from './laboratory.store';

describe('LaboratoryStore staff profile, photo and activity', () => {
  const userId = signal<number | null>(1);
  const api = { getStaffProfile: vi.fn(), getStaffPhoto: vi.fn(), getStaffActivity: vi.fn() };
  const profile = (hasPhoto: boolean) => new StaffMemberProfile({
    id: 2, username: 'ana', email: null, fullName: 'Ana Pérez', dni: null, phoneNumber: null, location: null,
    hasPhoto, updatedAt: null,
  });
  const entry = (id: number, timestamp: string) =>
    new StaffActivityEntry({ id, action: 'CREATE', entityType: 'BATCH', entityId: 1, timestamp });

  function create(): LaboratoryStore {
    TestBed.configureTestingModule({
      providers: [
        { provide: LaboratoryApi, useValue: api },
        { provide: IamStore, useValue: { currentUserId: userId, canManageQuality: signal(true) } },
      ],
    });
    const store = TestBed.inject(LaboratoryStore);
    TestBed.tick();
    return store;
  }

  beforeEach(() => {
    userId.set(1);
    api.getStaffProfile.mockReset().mockReturnValue(of(profile(true)));
    api.getStaffPhoto.mockReset().mockReturnValue(of(new Blob(['image'])));
    api.getStaffActivity.mockReset();
    let next = 0;
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:photo-${++next}`);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('reads the profile with its photo, without the photo when there is none or it fails', () => {
    const store = create();
    let read: unknown;
    store.staffProfile(7, 2).subscribe((value) => (read = value));
    expect(read).toEqual({ profile: profile(true), photoUrl: 'blob:photo-1' });

    api.getStaffProfile.mockReturnValue(of(profile(false)));
    store.staffProfile(7, 2).subscribe((value) => (read = value));
    expect(read).toEqual({ profile: profile(false), photoUrl: null });

    api.getStaffProfile.mockReturnValue(of(profile(true)));
    api.getStaffPhoto.mockReturnValue(throwError(() => new Error('unavailable')));
    store.staffProfile(7, 2).subscribe((value) => (read = value));
    expect(read).toEqual({ profile: profile(true), photoUrl: null });
  });

  it('downloads each photo of a list once and releases them when another person signs in', () => {
    const store = create();
    const urls: (string | null)[] = [];
    store.staffPhoto(7, 2).subscribe((url) => urls.push(url));
    store.staffPhoto(7, 2).subscribe((url) => urls.push(url));
    expect(urls).toEqual(['blob:photo-1', 'blob:photo-1']);
    expect(api.getStaffPhoto).toHaveBeenCalledTimes(1);

    userId.set(5);
    TestBed.tick();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo-1');
    store.staffPhoto(7, 2).subscribe((url) => urls.push(url));
    expect(api.getStaffPhoto).toHaveBeenCalledTimes(2);
  });

  it('tries a failed photo again on the next view', () => {
    api.getStaffProfile.mockReturnValueOnce(throwError(() => new Error('unavailable')));
    const store = create();
    let url: string | null | undefined;
    store.staffPhoto(7, 2).subscribe((value) => (url = value));
    expect(url).toBeNull();
    store.staffPhoto(7, 2).subscribe((value) => (url = value));
    expect(url).toBe('blob:photo-1');
  });

  it('lists the activity newest first without changing the answer of the platform', () => {
    const entries = [entry(1, '2026-10-01T10:00:00Z'), entry(2, '2026-10-02T10:00:00Z')];
    api.getStaffActivity.mockReturnValue(of(entries));
    const store = create();
    let ids: number[] = [];
    store.staffActivity(7, 2).subscribe((activity) => (ids = activity.map((e) => e.id)));
    expect(ids).toEqual([2, 1]);
    expect(entries.map((e) => e.id)).toEqual([1, 2]);
    expect(api.getStaffActivity).toHaveBeenCalledWith(7, 2);
  });
});
