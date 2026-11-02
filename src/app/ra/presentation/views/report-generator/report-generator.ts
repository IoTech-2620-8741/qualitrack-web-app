import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportGeneratorState } from './report-generator.state';
import { RaStore } from '../../../application/ra.store';
import { ErrorBanner } from '../../../../shared/presentation/components/error-banner/error-banner';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportTypeSelector } from '../../components/report-type-selector/report-type-selector';
import { ReportParamsForm } from '../../components/report-params-form/report-params-form';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [CommonModule, ReportTypeSelector, ReportParamsForm, ErrorBanner, MatProgressSpinnerModule, TranslatePipe],
  providers: [ReportGeneratorState],
  templateUrl: './report-generator.html',
  styleUrl: './report-generator.css'
})
export class ReportGeneratorComponent implements OnInit {
  protected store = inject(RaStore);

  ngOnInit() {
    this.store.clearMessages();
    this.store.loadBatches();
    this.store.loadEquipment();
    if (!this.store.environmentsLoaded()) void this.store.loadEnvironments();
  }
}
