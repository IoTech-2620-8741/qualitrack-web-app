import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Estado vacío reutilizable: icono + mensaje traducible.
 *
 * @remarks
 * Componente puro de presentación. Sin lógica de negocio, sin dependencias
 * del store. Reutilizable en cualquier vista que muestre listas o tablas.
 *
 * @example
 * ```html
 * <app-empty-state icon="manage_search" messageKey="audit-log.empty" />
 * ```
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [TranslatePipe, MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <p>{{ messageKey() | translate }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './empty-state.css',
})
export class EmptyState {
  /** Nombre del icono de Material a mostrar. */
  readonly icon = input('manage_search');

  /** Clave de traducción del mensaje. */
  readonly messageKey = input.required<string>();
}
