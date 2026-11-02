import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';

import { ReportGeneratorState } from '../../views/report-generator/report-generator.state';
import { RaStore } from '../../../application/ra.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { localIsoDate } from '../../../../shared/presentation/utils/local-date';
import {periodError, MAX_REPORT_DAYS} from '../../utils/report-period';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ReportPreviewDialog } from '../report-preview-dialog/report-preview-dialog';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-report-params-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatFormFieldModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonToggleModule, MatButtonModule, TranslatePipe
  ],
  templateUrl: './report-params-form.html',
  styleUrl: './report-params-form.css'
})
export class ReportParamsForm {
  private dialog = inject(MatDialog);
  protected state = inject(ReportGeneratorState);
  protected store = inject(RaStore);
  protected iamStore = inject(IamStore);

  protected readonly batches = computed(() => this.store.overviewBatches().data ?? []);
  protected readonly locatedEquipment = computed(() => (this.store.overviewEquipment().data ?? []).filter(e => e.environmentId !== null));

  // Exponer estas funciones para que el HTML pueda validar
  protected readonly periodError = periodError;
  protected readonly MAX_REPORT_DAYS = MAX_REPORT_DAYS;

  protected getTitle() {
    const titles: Record<string, string> = {
      batch: 'report-generator.batch.title',
      compliance: 'report-generator.compliance.title',
      inventory: 'report-generator.inventory.title',
      equipment: 'report-generator.equipment.title'
    };
    return titles[this.state.type()];
  }

  protected setQuickDate(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    this.state.updateForm({ startDate: start, endDate: end });
  }

  /** Valida que el formulario esté listo para generar el reporte */
  protected readonly isValid = computed(() => {
    const form = this.state.form();
    if (form.type === 'batch') return !!form.batchId;
    if (form.type === 'inventory') return true;
    if (form.type === 'compliance') {
      return !!form.startDate && !!form.endDate && !periodError(form.startDate, form.endDate, MAX_REPORT_DAYS);
    }
    if (form.type === 'equipment') {
      return !!form.equipmentId && !!form.startDate && !!form.endDate && !periodError(form.startDate, form.endDate, MAX_REPORT_DAYS);
    }
    return false;
  });

  /**
   * Genera una vista previa abriendo el PDF/CSV real en una nueva pestaña
   */
  protected async onPreview() {
    if (!this.isValid()) return;

    const form = this.state.form();
    const laboratoryId = this.iamStore.requireLaboratoryId();
    let command: any;

    switch (form.type) {
      case 'batch':
        command = { batchId: form.batchId!, includeDeviations: true, format: form.format };
        break;
      case 'compliance':
        command = { laboratoryId, environmentId: form.environmentId || null, startDate: localIsoDate(form.startDate!), endDate: localIsoDate(form.endDate!), format: form.format };
        break;
      case 'inventory':
        command = { laboratoryId, environmentId: form.environmentId || null, format: form.format };
        break;
      case 'equipment':
        const equipment = this.locatedEquipment().find(e => e.id === form.equipmentId);
        if (!equipment?.environmentId) return;
        command = { laboratoryId, environmentId: equipment.environmentId, equipmentId: form.equipmentId!, startDate: localIsoDate(form.startDate!), endDate: localIsoDate(form.endDate!), format: form.format };
        break;
    }

    try {
      const blob = await firstValueFrom(this.store.previewReport(form.type, command));

      this.dialog.open(ReportPreviewDialog, {
        width: '900px',
        maxWidth: '95vw',
        height: '85vh',
        panelClass: 'custom-dialog-container',
        data: {
          blob: blob,
          format: form.format,
          title: this.getTitle()
        }
      });
    } catch (error) {
      console.error('Error al generar vista previa', error);
      alert('No se pudo generar la vista previa del reporte.');
    }
  }


  /** Genera el reporte real en el backend */
  protected onGenerate() {
    if (!this.isValid) return;

    const form = this.state.form();
    const laboratoryId = this.iamStore.requireLaboratoryId();

    switch (form.type) {
      case 'batch':
        this.store.generateBatchReport({
          batchId: form.batchId!,
          includeDeviations: true,
          format: form.format
        });
        break;

      case 'compliance':
        this.store.generateComplianceReport({
          laboratoryId,
          environmentId: form.environmentId || null,
          startDate: localIsoDate(form.startDate!),
          endDate: localIsoDate(form.endDate!),
          format: form.format
        });
        break;

      case 'inventory':
        this.store.generateInventoryReport({
          laboratoryId,
          environmentId: form.environmentId || null,
          format: form.format
        });
        break;

      case 'equipment':
        const equipment = this.locatedEquipment().find(e => e.id === form.equipmentId);
        if (!equipment?.environmentId) return;

        this.store.exportEquipmentLog({
          laboratoryId,
          environmentId: equipment.environmentId,
          equipmentId: form.equipmentId!,
          startDate: localIsoDate(form.startDate!),
          endDate: localIsoDate(form.endDate!),
          format: form.format
        });
        break;
    }
  }
}
