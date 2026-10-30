import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { InventoryStore } from '../../../application/inventory.store';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Entry point of the inventory: opens the raw materials of the environment the user works with.
 *
 * @remarks
 * Raw materials are kept per environment (TS21). The default environment is the last one used,
 * otherwise the first raw material storage, otherwise the first environment of the laboratory.
 */
@Component({
  selector: 'app-inventory-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <main class="operations-page">
      <header class="page-heading">
        <h1>
          <mat-icon aria-hidden="true">inventory_2</mat-icon>{{ 'inventory.title' | translate }}
        </h1>
      </header>
      @if (store.environmentsLoading()) {
        <p role="status">{{ 'inventory.loading' | translate }}</p>
      } @else if (store.environmentsError()) {
        <p class="error" role="alert">{{ store.environmentsError() | translate }}</p>
      } @else if (store.environmentsEmpty()) {
        <section class="editor" role="status">
          <h2>{{ 'inventory.noEnvironments' | translate }}</h2>
          <p class="notice">{{ 'inventory.noEnvironmentsNotice' | translate }}</p>
          @if (iam.canManageQuality()) {
            <a mat-flat-button routerLink="/laboratories/environments/new">
              <mat-icon>add_location_alt</mat-icon>{{ 'environments.register' | translate }}
            </a>
          }
        </section>
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './inventory-home.css',
})
export class InventoryHome implements OnInit {
  protected readonly store = inject(InventoryStore);
  protected readonly iam = inject(IamStore);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    await this.store.loadEnvironments();
    const environment = this.store.preferredEnvironment();
    if (environment) {
      await this.router.navigate(['/inventory/environments', environment.id, 'raw-materials'], {
        replaceUrl: true,
      });
    }
  }
}
