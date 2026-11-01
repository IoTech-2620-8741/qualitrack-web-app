import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Banner de error traducible, con cierre opcional.
 *
 * @remarks
 * El `messageKey` debe ser una clave de traducción (no texto literal).
 * El padre decide si es descartable y qué hacer al cerrarlo.
 *
 * @example
 * ```html
 * @if (store.error()) {
 *   <app-error-banner [messageKey]="store.error()!" [dismissible]="true"
 *                     (dismiss)="store.clearMessages()" />
 * }
 * ```
 */
@Component({
  selector: 'app-error-banner',
  standalone: true,
  imports: [TranslatePipe, MatIconModule, MatButtonModule],
  template: `
    <div class="error-message" role="alert">
      <mat-icon aria-hidden="true">error_outline</mat-icon>
      <span class="message">{{ messageKey() | translate }}</span>
      @if (dismissible()) {
        <button
          mat-icon-button
          type="button"
          (click)="dismiss.emit()"
          [attr.aria-label]="'common.close' | translate">
          <mat-icon>close</mat-icon>
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './error-banner.css',
})
export class ErrorBanner {
  /** Clave de traducción del mensaje de error. */
  readonly messageKey = input.required<string>();

  /** Si muestra el botón de cerrar. */
  readonly dismissible = input(false);

  /** Emite cuando el usuario pulsa cerrar. */
  readonly dismiss = output<void>();
}
