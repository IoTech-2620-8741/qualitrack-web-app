import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { RaApi } from '../infrastructure/ra-api';
import { AuditedStaffMember } from '../domain/model/audited-staff-member.entity';
import { AuditLogEntry } from '../domain/model/audit-log-entry.entity';
import { RaStore } from './ra.store';

const entry = (id: number, timestamp: string) => new AuditLogEntry({
  id, timestamp, action: 'CREATE', entityType: 'BATCH', entityId: 1, performedBy: 1, details: '',
});
describe('RaStore staff activity', () => {
  const member = new AuditedStaffMember({ id: 2, fullName: 'Ana Pérez', role: 'Operator' });
  const api = { getAuditedStaffMember: vi.fn(), getStaffActivity: vi.fn() };
  beforeEach(() => {
    api.getAuditedStaffMember.mockReset().mockReturnValue(of(member));
    api.getStaffActivity.mockReset().mockReturnValue(of([]));
    TestBed.configureTestingModule({ providers: [
      { provide: IamStore, useValue: { requireLaboratoryId: () => 7, canManageQuality: () => true } },
      { provide: RaApi, useValue: api },
    ] });
  });
  it('sorts activity newest first without mutating the API result', () => {
    const entries = [entry(1, '2026-10-01T10:00:00Z'), entry(2, '2026-10-02T10:00:00Z')];
    api.getStaffActivity.mockReturnValue(of(entries));
    const store = TestBed.inject(RaStore);
    store.loadStaffActivity(2);
    expect(store.staffActivity().map((e) => e.id)).toEqual([2, 1]);
    expect(entries.map((e) => e.id)).toEqual([1, 2]);
    expect(store.auditedStaffMember()).toBe(member);
    expect(api.getAuditedStaffMember).toHaveBeenCalledWith(7, 2);
    expect(store.staffActivityLoading()).toBe(false);
  });
  it('cancels stale activity and clears previous data when the staff changes', () => {
    const stale = new Subject<AuditLogEntry[]>();
    api.getStaffActivity.mockReturnValueOnce(stale);
    const store = TestBed.inject(RaStore);
    store.loadStaffActivity(2);
    expect(store.staffActivityLoading()).toBe(true);
    store.loadStaffActivity(3);
    stale.next([entry(9, '2026-10-01T00:00:00Z')]); stale.complete();
    expect(store.staffActivity()).toEqual([]);
    store.clearStaffActivity();
    expect(store.auditedStaffMember()).toBeNull();
  });
  it('shows an error without retaining another staff member on failure', () => {
    const store = TestBed.inject(RaStore);
    store.loadStaffActivity(2);
    api.getStaffActivity.mockReturnValue(throwError(() => new Error('unavailable')));
    store.loadStaffActivity(3);
    expect(store.staffActivityError()).toBe('staff.detail.load-error');
    expect(store.auditedStaffMember()).toBeNull();
    expect(store.staffActivityLoading()).toBe(false);
  });
  it.each([0, -1, NaN, 1.5])('rejects an invalid identifier %s before requesting data', (id) => {
    const store = TestBed.inject(RaStore);
    store.loadStaffActivity(id);
    expect(api.getStaffActivity).not.toHaveBeenCalled();
    expect(store.staffActivityError()).toBe('staff.detail.load-error');
  });
});
