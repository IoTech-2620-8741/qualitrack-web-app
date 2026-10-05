import { AfterViewInit, Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MAX_PHOTO_BYTES, PHOTO_TYPES, ProfileStore } from '../../../application/profile.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { ApiError } from '../../../../shared/infrastructure/api-error';
import { NotificationPreferencesForm } from '../../../../ca/presentation/components/notification-preferences-form/notification-preferences-form';

/** 6 to 15 digits with an optional + prefix, spaces, hyphens and parentheses (same rule as the platform). */
function phoneNumber(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  const digits = value.replace(/\D/g, '').length;
  return /^\+?[0-9 ()-]+$/.test(value) && digits >= 6 && digits <= 15 ? null : { phoneNumber: true };
}

/** Letters and digits, as the password policy of the platform requires. */
function lettersAndDigits(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  return !value || (/[A-Za-z]/.test(value) && /\d/.test(value)) ? null : { strength: true };
}

/**
 * Profile of the signed-in user: photo, personal data, account (username and e-mail), password and notification
 * preferences. It opens from the name in the toolbar.
 */
@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TranslateModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    NotificationPreferencesForm,
  ],
  templateUrl: './profile-page.html',
  styleUrls: ['../../../../shared/presentation/styles/operations-page.css', './profile-page.css'],
})
export class ProfilePage implements AfterViewInit {
  protected readonly store = inject(ProfileStore);
  protected readonly iam = inject(IamStore);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly photoInput = viewChild<ElementRef<HTMLInputElement>>('photoInput');

  protected readonly photoTypes = PHOTO_TYPES.join(',');
  protected readonly photoBusy = signal(false);
  protected readonly photoError = signal<string | null>(null);
  protected readonly personalSaving = signal(false);
  protected readonly personalMessage = signal<{ ok: boolean; key: string } | null>(null);
  protected readonly accountSaving = signal(false);
  protected readonly accountMessage = signal<{ ok: boolean; key: string } | null>(null);
  protected readonly passwordSaving = signal(false);
  protected readonly passwordMessage = signal<{ ok: boolean; key: string } | null>(null);

  protected readonly roleKeys = computed(() => (this.store.profile()?.roles ?? this.iam.currentRoles())
    .map((role) => `profile.roles.${role}`));

  protected readonly personalForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    dni: ['', [Validators.pattern(/^\d{8}$/)]],
    phoneNumber: ['', [Validators.maxLength(30), phoneNumber]],
    location: ['', [Validators.minLength(2), Validators.maxLength(120)]],
  });

  protected readonly accountForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    currentPassword: ['', Validators.required],
  });

  protected readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72), lettersAndDigits]],
    confirmPassword: ['', Validators.required],
  });

  constructor() {
    this.store.load();
    effect(() => {
      const profile = this.store.profile();
      if (!profile) return;
      if (!this.personalForm.dirty) {
        this.personalForm.reset({
          fullName: profile.fullName ?? '',
          dni: profile.dni ?? '',
          phoneNumber: profile.phoneNumber ?? '',
          location: profile.location ?? '',
        });
      }
      if (!this.accountForm.dirty) {
        this.accountForm.reset({ username: profile.username, email: profile.email ?? '', currentPassword: '' });
      }
    });
  }

  ngAfterViewInit(): void {
    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((fragment) => {
      if (!fragment) return;
      setTimeout(() => this.host.nativeElement.querySelector(`#${CSS.escape(fragment)}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    });
  }

  protected choosePhoto(): void {
    this.photoInput()?.nativeElement.click();
  }

  protected photoChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const image = input.files?.[0];
    input.value = '';
    if (!image) return;
    this.photoError.set(null);
    if (!PHOTO_TYPES.includes(image.type)) {
      this.photoError.set('profile.photo.errors.type');
      return;
    }
    if (image.size > MAX_PHOTO_BYTES) {
      this.photoError.set('profile.photo.errors.size');
      return;
    }
    this.photoBusy.set(true);
    this.store.replacePhoto(image).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.photoBusy.set(false),
      error: (error) => {
        this.photoBusy.set(false);
        this.photoError.set(statusOf(error) === 413 ? 'profile.photo.errors.size'
          : statusOf(error) === 400 || statusOf(error) === 415 ? 'profile.photo.errors.type' : 'profile.photo.errors.failed');
      },
    });
  }

  protected removePhoto(): void {
    if (!confirm(this.translate.instant('profile.photo.remove-confirm'))) return;
    this.photoBusy.set(true);
    this.photoError.set(null);
    this.store.removePhoto().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.photoBusy.set(false),
      error: () => {
        this.photoBusy.set(false);
        this.photoError.set('profile.photo.errors.failed');
      },
    });
  }

  protected savePersonalData(): void {
    this.personalForm.markAllAsTouched();
    if (this.personalForm.invalid || this.personalSaving()) return;
    this.personalSaving.set(true);
    this.personalMessage.set(null);
    this.store.update(this.personalForm.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.personalSaving.set(false);
        this.personalForm.markAsPristine();
        this.personalMessage.set({ ok: true, key: 'profile.personal.saved' });
      },
      error: (error) => {
        this.personalSaving.set(false);
        this.personalMessage.set({
          ok: false,
          key: statusOf(error) === 400 ? 'profile.personal.errors.invalid' : 'profile.errors.failed',
        });
      },
    });
  }

  protected saveAccount(): void {
    this.accountForm.markAllAsTouched();
    if (this.accountForm.invalid || this.accountSaving()) return;
    this.accountSaving.set(true);
    this.accountMessage.set(null);
    this.iam.updateAccount(this.accountForm.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.accountSaving.set(false);
        this.accountForm.markAsPristine();
        this.accountForm.controls.currentPassword.reset('');
        this.accountMessage.set({ ok: true, key: 'profile.account.saved' });
        this.store.load();
      },
      error: (error) => {
        this.accountSaving.set(false);
        const status = statusOf(error);
        this.accountMessage.set({
          ok: false,
          key: status === 409 ? 'profile.account.errors.taken'
            : status === 400 ? 'profile.account.errors.invalid' : 'profile.errors.failed',
        });
      },
    });
  }

  protected changePassword(): void {
    this.passwordForm.markAllAsTouched();
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (this.passwordForm.invalid || this.passwordSaving()) return;
    if (newPassword !== confirmPassword) {
      this.passwordMessage.set({ ok: false, key: 'iam.change-password.errors.mismatch' });
      return;
    }
    if (newPassword === currentPassword) {
      this.passwordMessage.set({ ok: false, key: 'iam.change-password.errors.same-password' });
      return;
    }
    this.passwordSaving.set(true);
    this.passwordMessage.set(null);
    this.iam.changePassword(currentPassword, newPassword).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.passwordForm.reset();
        this.passwordMessage.set({ ok: true, key: 'profile.password.saved' });
      },
      error: (error) => {
        this.passwordSaving.set(false);
        this.passwordMessage.set({
          ok: false,
          key: statusOf(error) === 400 ? 'iam.change-password.errors.current-password'
            : 'iam.change-password.errors.unavailable',
        });
      },
    });
  }
}

function statusOf(error: unknown): number | null {
  return error instanceof ApiError || error instanceof HttpErrorResponse ? error.status : null;
}
