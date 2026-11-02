import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { ReportGeneratorState } from './report-generator.state';
import { RaStore } from '../../../application/ra.store';
import { ErrorBanner } from '../../../../shared/presentation/components/error-banner/error-banner';
import { ReportTypeSelector } from '../../components/report-type-selector/report-type-selector';
import { ReportParamsForm } from '../../components/report-params-form/report-params-form';

/**
 * Orchestrator component for the Report Generator view.
 *
 * @remarks
 * This component acts as a layout wrapper and state provider for the two main sections
 * of the report generator: the type selector and the parameters form.
 * It initializes the necessary domain data (batches, equipment, environments)
 * and handles the global loading and error states.
 */
@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    ReportTypeSelector,
    ReportParamsForm,
    ErrorBanner
  ],
  providers: [ReportGeneratorState],
  templateUrl: './report-generator.html',
  styleUrl: './report-generator.css'
})
export class ReportGeneratorComponent implements OnInit, OnDestroy {
  /** The application store managing the Reporting and Analysis state. */
  protected store = inject(RaStore);

  /** Initializes the component by loading the required reference data. */
  ngOnInit() {
    this.store.clearMessages();
    this.store.clearReportPreview();
    this.store.loadBatches();
    this.store.loadEquipment();
    if (!this.store.environmentsLoaded()) void this.store.loadEnvironments();
  }

  /** Forgets the previewed report, so a later visit generates the report again with the current data. */
  ngOnDestroy() {
    this.store.clearReportPreview();
  }
}
