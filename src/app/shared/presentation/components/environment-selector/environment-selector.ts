import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
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

/** Value of the option that stands for every environment; `mat-select` treats `null` as clearing the selection. */
const ALL_ENVIRONMENTS = 'all';

/**
 * Selector of the environment in which a view works (inventory, products, alerts, telemetry, reports).
 *
 * @remarks
 * A visual component without domain logic: the hosting view passes the environments of its own context and
 * decides what to do with the selected one. A view that can also work with every environment passes
 * `allOptionKey` to offer that option, shown as selected while `selectedId` is null.
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
        [value]="selectedValue()"
        (selectionChange)="select($event.value)"
        [attr.aria-label]="'environments.selector' | translate"
      >
        @if (allOptionKey(); as allOptionKey) {
          <mat-option [value]="allEnvironments">
            {{ allOptionKey | translate: { count: environments().length } }}
          </mat-option>
        }
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
  styleUrl: './environment-selector.css',
})
export class EnvironmentSelector {
  /** Environments to choose from. */
  readonly environments = input.required<readonly EnvironmentOption[]>();

  /** Identifier of the selected environment, or null when none is selected. */
  readonly selectedId = input<number | null>(null);

  /** Translation key of the option for every environment, which receives `count`; without it, no option is offered. */
  readonly allOptionKey = input<string | null>(null);

  /** Emits the identifier of the environment the user selects. */
  readonly selectedChange = output<number>();

  /** Emits when the user selects the option for every environment. */
  readonly allSelected = output<void>();

  protected readonly allEnvironments = ALL_ENVIRONMENTS;

  /** Value the select shows as chosen. */
  protected readonly selectedValue = computed(() => {
    const selectedId = this.selectedId();
    return selectedId === null && this.allOptionKey() ? ALL_ENVIRONMENTS : selectedId;
  });

  /**
   * Tells the view what the user selected.
   *
   * @param value - The value of the chosen option
   */
  protected select(value: number | typeof ALL_ENVIRONMENTS): void {
    if (value === ALL_ENVIRONMENTS) this.allSelected.emit();
    else this.selectedChange.emit(value);
  }
}
