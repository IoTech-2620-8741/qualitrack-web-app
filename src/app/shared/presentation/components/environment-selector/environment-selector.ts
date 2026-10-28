import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

/**
 * Environment that the selector offers: what a view shows of the environments it works with.
 */
export interface EnvironmentOption {
  id: number;
  code: string;
  name: string;
  usage?: string | null;
}

/**
 * Selector of the environment in which a view works (inventory, products, alerts, telemetry, reports).
 *
 * @remarks
 * A visual component without domain logic: the hosting view passes the environments of its own context and
 * decides what to do with the selected one.
 */
@Component({
  selector: 'app-environment-selector',
  standalone: true,
  imports: [TranslatePipe, MatFormFieldModule, MatSelectModule, MatIconModule],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="environment-selector">
      <mat-label>{{ 'environments.selector' | translate }}</mat-label>
      <mat-icon matPrefix aria-hidden="true">meeting_room</mat-icon>
      <mat-select
        [value]="selectedId()"
        (selectionChange)="selectedChange.emit($event.value)"
        [attr.aria-label]="'environments.selector' | translate"
      >
        @for (environment of environments(); track environment.id) {
          <mat-option [value]="environment.id">
            {{ environment.code }} · {{ environment.name }}
            @if (environment.usage) {
              <small class="usage"
                >({{ 'environment-usage.' + environment.usage | translate }})</small
              >
            }
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .environment-selector {
      min-width: 280px;
    }
    .usage {
      color: #5f6368;
    }
    @media (max-width: 600px) {
      .environment-selector {
        width: 100%;
        min-width: 0;
      }
    }
  `,
})
export class EnvironmentSelector {
  /** Environments to choose from. */
  readonly environments = input.required<readonly EnvironmentOption[]>();

  /** Identifier of the selected environment, or null when none is selected. */
  readonly selectedId = input<number | null>(null);

  /** Emits the identifier of the environment the user selects. */
  readonly selectedChange = output<number>();
}
