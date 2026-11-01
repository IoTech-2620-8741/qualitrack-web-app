import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {AUDIT_LOG_COLUMNS, AuditLogRow} from '../../utils/audit-log-viewer.utils';
import {NgClass} from '@angular/common';
import {EmptyState} from '../../../../shared/presentation/components/empty-state/empty-state';

/**
 * Tabla de solo presentación del audit log.
 * No conoce el store ni los filtros: recibe filas ya formateadas y estados de carga.
 */
@Component({
  selector: 'app-audit-log-table',
  standalone: true,
  imports: [TranslatePipe, MatTableModule, MatIconModule, MatProgressSpinnerModule, NgClass, EmptyState],
  templateUrl: './audit-log-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './audit-log-table.css',
})
export class AuditLogTable {
  /** Filas ya formateadas por el padre. */
  readonly rows = input.required<readonly AuditLogRow[]>();

  /** Si el store está cargando. */
  readonly loading = input(false);

  /** Columnas visibles. */
  protected readonly columns = AUDIT_LOG_COLUMNS;
}
