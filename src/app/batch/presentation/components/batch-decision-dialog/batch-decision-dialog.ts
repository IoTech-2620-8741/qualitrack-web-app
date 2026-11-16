import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { Batch } from '../../../domain/model/batch.entity';

/** What the dialog confirms and on which batch. */
export interface BatchDecisionData {
  decision: 'release' | 'reject';
  batch: Batch;
}

/**
 * Asks to confirm the release or the rejection of a batch, naming it, because neither can be undone.
 *
 * @remarks
 * Closes with `true` only when the person confirms.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-decision-dialog',
  imports: [DecimalPipe, MatButton, MatIcon, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'batch-' + data.decision + '.confirm-title' | translate: { batch: data.batch.batchNumber } }}</h2>
    <mat-dialog-content>
      <p>{{ data.batch.productName }} · {{ data.batch.quantity | number: '1.0-3' }} {{ data.batch.unit }}</p>
      <p>{{ 'batch-' + data.decision + '.notice' | translate }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">{{ 'common.cancel' | translate }}</button>
      <button mat-flat-button type="button" [mat-dialog-close]="true">
        <mat-icon>{{ data.decision === 'release' ? 'verified' : 'cancel' }}</mat-icon>
        {{ 'batch-' + data.decision + '.confirm-action' | translate: { batch: data.batch.batchNumber } }}
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchDecisionDialog {
  protected readonly data = inject<BatchDecisionData>(MAT_DIALOG_DATA);
}
