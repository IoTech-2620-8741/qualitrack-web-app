import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * @summary Barra de navegación superior (Toolbar) para QualiTrack.
 * @remarks Componente presentacional que envuelve el logo de la marca,
 * el título y el selector de idiomas. Se utiliza principalmente en
 * vistas públicas (como el Home) donde no se requiere el Sidenav.
 * @author QualiTrack
 */
@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [MatToolbarModule, RouterLink, TranslatePipe, LanguageSwitcher],
  templateUrl: './toolbar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './toolbar.css',
})
export class Toolbar {
  private readonly iam = inject(IamStore);

  /** The logo and the name lead to the home page before signing in and to the dashboard afterwards. */
  protected readonly brandLink = computed(() => (this.iam.isSignedIn() ? '/dashboard' : '/home'));
  protected readonly brandLabel = computed(() =>
    this.iam.isSignedIn() ? 'brand.go-dashboard' : 'brand.go-home',
  );
}
