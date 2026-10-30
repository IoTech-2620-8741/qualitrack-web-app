import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [MatToolbarModule, RouterLink, TranslatePipe, LanguageSwitcher],
  templateUrl: './toolbar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './toolbar.css',
})
export class Toolbar {
  readonly isSignedIn = input<boolean>(false);

  protected readonly brandLink = computed(() => (this.isSignedIn() ? '/dashboard' : '/home'));
  protected readonly brandLabel = computed(() =>
    this.isSignedIn() ? 'brand.go-dashboard' : 'brand.go-home',
  );
}
