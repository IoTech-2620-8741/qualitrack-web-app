import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, of, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { IamStore } from '../../../../iam/application/iam.store';
import { LaboratoryStore } from '../../../application/laboratory.store';
import { StaffMember } from '../../../domain/model/staff-member.entity';
import { ProfileStore, StaffProfile } from '../../../../profile/application/profile.store';
import { StaffAvatar } from '../../../../profile/presentation/components/staff-avatar/staff-avatar';
import { RaStore } from '../../../../ra/application/ra.store';
import { activityActionKey, activityEntityKey } from '../../../../ra/presentation/staff-activity-labels';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { ListToolbar } from '../../../../shared/presentation/components/list-toolbar/list-toolbar';
import { FilterChip } from '../../../../shared/presentation/components/filter-chip/filter-chip';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

/** Periods the activity can be narrowed to, in days; 0 shows all of it. */
const ACTIVITY_PERIODS = [0, 7, 30, 90] as const;

/** One of {@link ACTIVITY_PERIODS}. */
type ActivityPeriod = (typeof ACTIVITY_PERIODS)[number];

/** Value of the selects that keeps every action or type of record. */
const ALL = 'ALL';

/**
 * Everything about a staff member in one page: who they are, their account, their profile and what they registered.
 *
 * @remarks
 * Quality managers and auditors open it from the staff list. The profile (DNI, phone, location and photo) is read
 * only by the quality manager and only for members with an account; the activity history can be narrowed by period,
 * action and type of record. The quality manager can also deactivate the member from here.
 */
@Component({
  selector: 'app-staff-detail',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    DateTimePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    StaffAvatar,
    ListToolbar,
    FilterChip,
    TablePaginator,
  ],
  templateUrl: './staff-detail.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './staff-detail.css',
})
export class StaffDetail {
  protected readonly iam = inject(IamStore);
  /** Activity of the staff member. */
  protected readonly activity = inject(RaStore);
  private readonly route = inject(ActivatedRoute);
  private readonly laboratoryStore = inject(LaboratoryStore);
  private readonly profiles = inject(ProfileStore);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly member = signal<StaffMember | null>(null);
  protected readonly deactivating = signal(false);

  /** Profile of the member with its photo; null while it loads, when there is none or when it cannot be read. */
  protected readonly profile = signal<StaffProfile | null>(null);
  /** Whether the profile is being read. */
  protected readonly profileLoading = signal(false);

  /** Whether this person may see the profile of the member: the quality manager, for members with an account. */
  protected readonly showsProfile = computed(() => this.iam.canManageQuality() && this.member()?.userId != null);

  /** Periods offered as chips. */
  protected readonly periods = ACTIVITY_PERIODS;
  /** Period the activity is narrowed to, in days; 0 shows all of it. */
  protected readonly period = signal<ActivityPeriod>(0);
  /** Action the activity is narrowed to. */
  protected readonly action = signal(ALL);
  /** Type of record the activity is narrowed to. */
  protected readonly entityType = signal(ALL);
  protected readonly all = ALL;

  /** Actions present in the activity, for the select. */
  protected readonly actions = computed(() =>
    [...new Set(this.activity.staffActivity().map((entry) => entry.action as string))].sort(),
  );
  /** Types of record present in the activity, for the select. */
  protected readonly entityTypes = computed(() =>
    [...new Set(this.activity.staffActivity().map((entry) => entry.entityType))].sort(),
  );

  /** Activity of the chosen period, action and type of record, newest first. */
  protected readonly visibleActivity = computed(() => {
    const days = this.period();
    const since = days ? Date.now() - days * 24 * 60 * 60 * 1000 : null;
    const action = this.action();
    const entityType = this.entityType();
    return this.activity
      .staffActivity()
      .filter((entry) => since === null || new Date(entry.timestamp).getTime() >= since)
      .filter((entry) => action === ALL || entry.action === action)
      .filter((entry) => entityType === ALL || entry.entityType === entityType);
  });

  /** Page of the activity shown; ten rows unless the person chooses more. */
  protected readonly activityPage = paginate(() => this.visibleActivity());

  /** How many filters narrow the activity, for the folded toolbar. */
  protected readonly activeFilters = computed(
    () => (this.period() ? 1 : 0) + (this.action() !== ALL ? 1 : 0) + (this.entityType() !== ALL ? 1 : 0),
  );

  /** Moment of the latest activity. */
  protected readonly lastActivity = computed(() => this.activity.staffActivity()[0]?.timestamp ?? null);

  protected readonly actionKey = activityActionKey;
  protected readonly entityKey = activityEntityKey;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.activity.clearStaffActivity();
      this.showProfile(null);
    });
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.loading.set(true);
          this.error.set(null);
          this.member.set(null);
          this.showProfile(null);
          this.clearFilters();
          const staffId = Number(params.get('staffId'));
          if (!Number.isSafeInteger(staffId) || staffId <= 0) return of(null);
          this.activity.loadStaffActivity(staffId);
          return this.laboratoryStore
            .staffMember(this.iam.requireLaboratoryId(), staffId)
            .pipe(catchError(() => of(null)));
        }),
        switchMap((member) => {
          this.member.set(member);
          this.loading.set(false);
          if (!member) {
            this.error.set('staff.detail.load-error');
            return of(null);
          }
          if (!this.showsProfile()) return of(null);
          this.profileLoading.set(true);
          return this.profiles
            .staffProfile(member.laboratoryId, member.id)
            .pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((profile) => {
        this.showProfile(profile);
        this.profileLoading.set(false);
      });
  }

  /** Shows the whole activity again. */
  protected clearFilters(): void {
    this.period.set(0);
    this.action.set(ALL);
    this.entityType.set(ALL);
  }

  protected deactivate(member: StaffMember): void {
    if (!confirm(this.translate.instant('staff-list.deactivate-confirm', { name: member.fullName }))) return;
    this.deactivating.set(true);
    this.error.set(null);
    this.laboratoryStore
      .deactivateStaff(member.laboratoryId, member.id)
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

  /**
   * Replaces the profile shown, releasing the photo of the previous one.
   *
   * @param profile - Profile to show, or null to show none
   */
  private showProfile(profile: StaffProfile | null): void {
    const previous = this.profile()?.photoUrl;
    if (previous && previous !== profile?.photoUrl) URL.revokeObjectURL(previous);
    this.profile.set(profile);
  }
}
