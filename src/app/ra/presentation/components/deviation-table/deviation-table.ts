import { Component, input, output } from '@angular/core';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow,
  MatHeaderRowDef, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';

/**
 * Presentational component that renders a table of deviation trends.
 *
 * @remarks
 * This component displays the list of variables, their time-in-range percentage,
 * deviation counts, and trend direction. It emits an event when a row is selected,
 * allowing the parent component to update the active chart.
 */
@Component({
  imports: [
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderCellDef,
    MatCellDef,
    MatIcon,
    MatHeaderRow,
    MatRow,
    TranslatePipe,
    MatRowDef,
    MatHeaderRowDef,
    DecimalPipe,
  ],
  selector: 'app-deviation-table',
  styleUrl: './deviation-table.css',
  templateUrl: './deviation-table.html',
})
export class DeviationTable {
  /** The list of deviation trends to display in the table. */
  readonly trends = input.required<any[]>();

  /** Function to resolve a device ID to its human-readable label. */
  readonly deviceLabel = input.required<(id: number) => string>();

  /** Function that returns the Material Icon name based on the trend direction (e.g., 'INCREASING'). */
  readonly trendIcon = input.required<(dir: string) => string>();

  /** Function to determine if a specific trend row is currently active/selected. */
  readonly isActive = input.required<(trend: any) => boolean>();

  /** Emits the selected trend when the user clicks on a row. */
  readonly select = output<any>();

  /** Defines the column order and keys for the Material table. */
  protected readonly columns = ['variable', 'timeInRange', 'deviations', 'critical', 'trend'];
}
