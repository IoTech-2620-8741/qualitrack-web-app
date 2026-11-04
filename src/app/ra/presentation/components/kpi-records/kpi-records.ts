import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { KpiMetric } from '../../../domain/model/kpi-metric.entity';

/**
 * Component that displays the laboratory record summaries as clickable cards.
 *
 * @remarks
 * This component receives the current operational metrics (e.g., total equipment,
 * open alerts, registered batches) and renders them in a grid of `mat-card` elements.
 * Each card acts as a link that navigates the user to the relevant module
 * (Equipment, Alerts, or Batches) to see the full details.
 */
@Component({
  selector: 'app-kpi-records',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink, MatCardModule],
  templateUrl: './kpi-records.html',
  styleUrl: './kpi-records.css'
})
export class KpiRecords {
  /** The array of operational metrics containing the name and current value. */
  readonly metrics = input.required<KpiMetric[]>();

  /**
   * Resolves the navigation route based on the metric name.
   *
   * @param name - The identifier of the metric (e.g., 'equipment-count', 'unresolved-alert-count').
   * @returns The absolute path to the corresponding module.
   */
  protected getRoute(name: string): string {
    switch (name) {
      case 'equipment-count': return '/equipments';
      case 'unresolved-alert-count': return '/alerts';
      default: return '/batches';
    }
  }

  /**
   * Resolves the translation key for the action link displayed on the card.
   *
   * @param name - The identifier of the metric.
   * @returns The translation key for the link text (e.g., "View equipment", "View alerts").
   */
  protected getLinkText(name: string): string {
    switch (name) {
      case 'equipment-count': return 'reporting.summary.link-equipment';
      case 'unresolved-alert-count': return 'reporting.summary.link-alerts';
      default: return 'reporting.summary.link-batches';
    }
  }
}
