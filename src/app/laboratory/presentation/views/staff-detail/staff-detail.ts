import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, forkJoin, of, switchMap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { IamStore } from '../../../../iam/application/iam.store';
import { LaboratoryApi } from '../../../infrastructure/laboratory-api';
import { LaboratoryStore } from '../../../application/laboratory.store';
import { StaffMember } from '../../../domain/model/staff-member.entity';
import { RaApi } from '../../../../ra/infrastructure/ra-api';
import { AuditLogEntry } from '../../../../ra/domain/model/audit-log-entry.entity';

/** Records whose type has a translated name; any other type is shown as the platform sends it. */
const KNOWN_ENTITIES = new Set([
  'BATCH', 'BPM_PARAMETER_CONFIG', 'DEVIATION_ALERT', 'ENVIRONMENT', 'EQUIPMENT', 'EQUIPMENT_TELEMETRY_STATUS',
  'ENVIRONMENTAL_PROFILE', 'LABORATORY', 'MAINTENANCE_RECORD', 'NOTIFICATION_PREFERENCE', 'PHARMACEUTICAL_PRODUCT', 'RAW_MATERIAL',
  'RAW_MATERIAL_BATCH', 'RAW_MATERIAL_USAGE', 'STAFF_MEMBER', 'TELEMETRY_ANOMALY', 'TELEMETRY_HISTORY_POINT',
  'TELEMETRY_MEASUREMENT',
]);

/** Actions with a translated name. */
const KNOWN_ACTIONS = new Set([
  'CREATE', 'UPDATE', 'DELETE', 'RELEASE', 'REJECT', 'APPROVE', 'REGISTER', 'REMOVE', 'EXPORT', 'GENERATE',
]);

/**
 * Profile of a staff member and what they did with their account (maintenance, receipts, batches…),
 * consulted by quality managers and auditors from the staff list.
 */
@Component({
  selector: 'app-staff-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './staff-detail.html',
  styleUrls: ['../../../../shared/presentation/styles/operations-page.css', './staff-detail.css'],
})
export class StaffDetail {
  protected readonly iam = inject(IamStore);
  private readonly route = inject(ActivatedRoute);
  private readonly laboratoryApi = inject(LaboratoryApi);
  private readonly laboratoryStore = inject(LaboratoryStore);
  private readonly raApi = inject(RaApi);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly member = signal<StaffMember | null>(null);
  protected readonly activity = signal<AuditLogEntry[]>([]);
  protected readonly entityFilter = signal<string>('ALL');
  protected readonly deactivating = signal(false);

  protected readonly entityTypes = computed(() =>
    [...new Set(this.activity().map((entry) => entry.entityType))].sort());

  protected readonly visibleActivity = computed(() => {
    const filter = this.entityFilter();
    return filter === 'ALL' ? this.activity() : this.activity().filter((entry) => entry.entityType === filter);
  });

  protected readonly lastActivity = computed(() => this.activity()[0]?.timestamp ?? null);

  constructor() {
    this.route.paramMap.pipe(
      switchMap((params) => {
        this.loading.set(true);
        this.error.set(null);
        const staffId = Number(params.get('staffId'));
        if (!Number.isSafeInteger(staffId) || staffId <= 0) return of(null);
        const laboratoryId = this.iam.requireLaboratoryId();
        return forkJoin({
          member: this.laboratoryApi.getStaffMember(laboratoryId, staffId),
          activity: this.raApi.getStaffActivity(laboratoryId, staffId),
        }).pipe(catchError(() => of(null)));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      this.loading.set(false);
      this.entityFilter.set('ALL');
      if (!result) {
        this.member.set(null);
        this.activity.set([]);
        this.error.set('staff.detail.load-error');
        return;
      }
      this.member.set(result.member);
      this.activity.set([...result.activity].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    });
  }

  protected entityKey(entityType: string): string | null {
    return KNOWN_ENTITIES.has(entityType) ? `staff.activity.entities.${entityType.toLowerCase()}` : null;
  }

  protected actionKey(action: string): string | null {
    return KNOWN_ACTIONS.has(action) ? `staff.activity.actions.${action.toLowerCase()}` : null;
  }

  protected deactivate(member: StaffMember): void {
    if (!confirm(this.translate.instant('staff-list.deactivate-confirm', { name: member.fullName }))) return;
    this.deactivating.set(true);
    this.error.set(null);
    this.laboratoryStore.deactivateStaff(member.laboratoryId, member.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (deactivated) => {
          this.member.set(deactivated);
          this.deactivating.set(false);
        },
        error: () => {
          this.error.set('staff-list.deactivate-error');
          this.deactivating.set(false);
        },
      });
  }
}
