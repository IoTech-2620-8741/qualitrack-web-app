import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EnvironmentStore } from '../../../application/environment.store';
import { Environment } from '../../../domain/model/environment.entity';
import { ENVIRONMENT_USAGES, EnvironmentUsage } from '../../../domain/model/environment-usage';

/**
 * Component that lists the environments of the current laboratory (US32).
 *
 * @remarks
 * Quality managers can register and edit environments and assign their usage (US30, US31, US33);
 * other members of the laboratory can only consult them.
 */
@Component({
  selector: 'app-environment-list',
  standalone: true,
  imports: [
    TranslateModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './environment-list.html',
  styleUrl: './environment-list.css',
})
export class EnvironmentList implements OnInit {
  protected readonly store = inject(EnvironmentStore);
  private readonly router = inject(Router);

  protected readonly usages = ENVIRONMENT_USAGES;

  protected get displayedColumns(): string[] {
    return this.store.canManage()
      ? ['code', 'name', 'usage', 'description', 'actions']
      : ['code', 'name', 'usage', 'description'];
  }

  ngOnInit(): void {
    void this.store.loadEnvironments();
  }

  protected onRegister(): void {
    void this.router.navigate(['/laboratories/environments/new']);
  }

  protected onEdit(environment: Environment): void {
    void this.router.navigate(['/laboratories/environments', environment.id, 'edit']);
  }

  protected onAssignUsage(environment: Environment, usage: EnvironmentUsage): void {
    void this.store.assignUsage(environment.id, usage);
  }

  protected usageKey(usage: EnvironmentUsage | null): string {
    return usage ? `environment-usage.${usage}` : 'environments.usage-not-assigned';
  }
}
