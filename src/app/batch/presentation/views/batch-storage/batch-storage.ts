import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { BatchStore, batchError } from '../../../application/batch.store';
import { BatchPath } from '../../../infrastructure/batch-api-endpoint';
import { EquipmentApi } from '../../../../equipment/infrastructure/equipment-api';
import { Equipment } from '../../../../equipment/domain/model/equipment.entity';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { Environment } from '../../../../laboratory/domain/model/environment.entity';
import { IamStore } from '../../../../iam/application/iam.store';

/** Operational container monitors of one product storage environment. */
interface StorageArea {
  environment: Environment;
  containers: Equipment[];
}

/**
 * Monitored container where a product batch is stored (US78, US79).
 *
 * @remarks
 * Batches are stored in an operational container monitor of a product storage environment of the laboratory;
 * the backend rejects containers of other environments and monitors in maintenance or out of service.
 */
@Component({
  selector: 'app-batch-storage',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, MatButtonModule, MatIconModule, MatSelectModule, TranslateModule],
  templateUrl: './batch-storage.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class BatchStorage implements OnInit {
  readonly path = input.required<BatchPath>();
  readonly batchId = input.required<number>();
  protected readonly store = inject(BatchStore);
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly environments = inject(EnvironmentStore);
  protected readonly iam = inject(IamStore);
  protected readonly equipment = signal<Equipment[]>([]);
  protected readonly loadError = signal<string | null>(null);
  protected containerMonitorId: number | null = null;
  protected readonly container = computed(() => this.store.traceability()?.container ?? null);
  /** Product storage environments with their operational container monitors. */
  protected readonly storageAreas = computed<StorageArea[]>(() =>
    this.environments.environments()
      .filter((environment) => environment.usage === 'PRODUCT_STORAGE')
      .map((environment) => ({
        environment,
        containers: this.equipment().filter((item) => item.deviceType === 'CONTAINER_MONITOR'
          && item.environmentId === environment.id && item.status === 'OPERATIONAL'),
      })),
  );
  protected readonly hasContainers = computed(() => this.storageAreas().some((area) => area.containers.length > 0));
  /** Users who register operations store batches; auditors only consult them. */
  protected readonly editable = this.iam.canOperate;

  async ngOnInit(): Promise<void> {
    const laboratoryId = this.iam.requireLaboratoryId();
    try {
      if (!this.environments.loaded()) await this.environments.loadEnvironments();
      if (this.editable()) this.equipment.set(await firstValueFrom(this.equipmentApi.getEquipment(laboratoryId)));
    } catch (error) {
      this.loadError.set(batchError(error));
    }
  }

  /** Name of the environment of the container, or its identifier while environments are loading. */
  protected environmentName(environmentId: number): string {
    const environment = this.environments.environments().find((item) => item.id === environmentId);
    return environment ? `${environment.code} · ${environment.name}` : `#${environmentId}`;
  }

  protected async storeBatch(): Promise<void> {
    if (this.containerMonitorId === null) return;
    if (await this.store.assignContainer(this.path(), this.batchId(), this.containerMonitorId)) this.containerMonitorId = null;
  }
}
