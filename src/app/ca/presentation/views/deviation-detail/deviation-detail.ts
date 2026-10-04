import { Component, DestroyRef, OnInit, Signal, computed, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CaStore } from '../../../application/ca.store';
import { DeviationAlert } from '../../../domain/model/deviation-alert.entity';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';

/**
 * Detail of a deviation alert (US86): where it originated, which condition produced it, how the incident evolved and
 * the actions of its container monitor; operators and quality managers attend (US87) and resolve it (US88).
 */
@Component({
  selector: 'app-deviation-detail',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
  ],
  templateUrl: './deviation-detail.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class DeviationDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  protected readonly store = inject(CaStore);
  protected readonly environments = inject(EnvironmentStore);

  protected alertId = 0;
  protected alert!: Signal<DeviationAlert | undefined>;

  protected readonly resolutionForm = this.fb.nonNullable.group({
    resolutionNotes: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  });

  /** Environment of the alert, shown with its code and name. */
  protected readonly environmentName = computed(() => {
    const environmentId = this.alert?.()?.environmentId;
    const environment = this.environments.environments().find((item) => item.id === environmentId);
    return environment ? `${environment.code} · ${environment.name}` : null;
  });

  ngOnInit(): void {
    if (!this.environments.loaded()) void this.environments.loadEnvironments();
    this.store.loadDevices();
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      this.alertId = Number(params.get('id')) || 0;
      this.alert = this.store.getAlertById(this.alertId);
      this.resolutionForm.reset();
      this.store.clearError();
      this.store.loadAlertById(this.alertId);
    });
  }

  /** Translated name of a monitored variable, or the stored name when it is not a known metric. */
  protected variable(parameterName: string): string {
    const key = 'tracking.metrics.' + parameterName;
    const label = this.translate.instant(key);
    return label === key ? parameterName : label;
  }

  protected acknowledge(): void {
    this.store.acknowledgeAlert(this.alertId);
  }

  protected resolve(): void {
    this.resolutionForm.markAllAsTouched();
    if (this.resolutionForm.invalid) return;
    this.store.resolveAlert(this.alertId, { resolutionNotes: this.resolutionForm.getRawValue().resolutionNotes.trim() });
  }
}
