import { Injectable, signal, computed } from '@angular/core';
import { ALL_ENVIRONMENTS } from '../../../domain/model/indicator-period';

export type ReportType = 'batch' | 'compliance' | 'inventory' | 'equipment';

export interface ReportConfig {
  type: ReportType;
  batchId: number | null;
  equipmentId: number | null;
  environmentId: number;
  startDate: Date | null;
  endDate: Date | null;
  format: 'PDF' | 'CSV';
}

@Injectable()
export class ReportGeneratorState {
  readonly type = signal<ReportType>('compliance');
  readonly form = signal<ReportConfig>({
    type: 'compliance',
    batchId: null,
    equipmentId: null,
    environmentId: ALL_ENVIRONMENTS,
    startDate: null,
    endDate: null,
    format: 'PDF'
  });
  setType(newType: ReportType) {
    this.type.set(newType);
    this.form.update(f => ({ ...f, type: newType }));
  }
  updateForm(partial: Partial<ReportConfig>) {
    this.form.update(f => ({ ...f, ...partial }));
  }
}
