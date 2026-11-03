import { Component, input, output } from '@angular/core';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow,
  MatHeaderRowDef, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';

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
  readonly trends = input.required<any[]>();
  readonly deviceLabel = input.required<(id: number) => string>();
  readonly trendIcon = input.required<(dir: string) => string>();
  readonly isActive = input.required<(trend: any) => boolean>();

  readonly select = output<any>();

  protected readonly columns = ['variable', 'timeInRange', 'deviations', 'critical', 'trend'];
}
