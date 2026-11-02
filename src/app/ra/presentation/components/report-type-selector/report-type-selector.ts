import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReportGeneratorState, ReportType } from '../../views/report-generator/report-generator.state';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-report-type-selector',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './report-type-selector.html',
  styleUrl: './report-type-selector.css'
})
export class ReportTypeSelector {
  protected state = inject(ReportGeneratorState);

  protected readonly options = [
    { id: 'batch' as ReportType, icon: 'inventory_2', titleKey: 'report-generator.batch.title', descKey: 'report-generator.batch.desc', format: 'PDF · CSV' },
    { id: 'compliance' as ReportType, icon: 'verified', titleKey: 'report-generator.compliance.title', descKey: 'report-generator.compliance.desc', format: 'PDF · CSV' },
    { id: 'inventory' as ReportType, icon: 'inventory', titleKey: 'report-generator.inventory.title', descKey: 'report-generator.inventory.desc', format: 'PDF · CSV' },
    { id: 'equipment' as ReportType, icon: 'precision_manufacturing', titleKey: 'report-generator.equipment.title', descKey: 'report-generator.equipment.desc', format: 'PDF · CSV' }
  ];
}
