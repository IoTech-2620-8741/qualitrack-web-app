import { Component, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentStore, equipmentError } from '../../../application/equipment.store';
import { EdgeGatewayCoverage } from '../../../domain/model/edge-gateway-coverage.entity';
import { Equipment } from '../../../domain/model/equipment.entity';

/**
 * What is located in an environment: its Edge Gateways, IoT devices and equipment (US46, US52, US54).
 *
 * @remarks
 * The user only locates devices and Edge Gateways in the environment; the cloud works out which
 * Edge Gateway serves each device. This view shows that result and warns when there are devices
 * that no Edge Gateway serves, because they send no telemetry until another one is located.
 */
@Component({
  selector: 'app-environment-equipment',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe],
  templateUrl: './environment-equipment.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './environment-equipment.css',
})
export class EnvironmentEquipment implements OnInit {
  /** Route from which the identifier of the environment is read. */
  private readonly route = inject(ActivatedRoute);

  /** Store that manages the equipment of the current laboratory. */
  protected readonly store = inject(EquipmentStore);

  /** Identifier of the environment shown by the view. */
  protected readonly environmentId = signal(0);

  /** Everything located in the environment. */
  protected readonly located = signal<Equipment[]>([]);

  /** How the Edge Gateways of the environment cover its IoT devices, or `null` until it is loaded. */
  protected readonly coverage = signal<EdgeGatewayCoverage | null>(null);

  /** Whether the content of the environment is being loaded. */
  protected readonly loading = signal(false);

  /** Translation key or server message of the last load error, or `null` if there is none. */
  protected readonly error = signal<string | null>(null);

  /** The environment shown by the view, once the environments of the laboratory are known. */
  protected readonly environment = computed(
    () => this.store.environments().find((item) => item.id === this.environmentId()) ?? null,
  );

  /** IoT devices located in the environment. */
  protected readonly devices = computed(() => this.located().filter((item) => item.isIotDevice));

  /** Process equipment located in the environment: neither IoT devices nor Edge Gateways. */
  protected readonly processEquipment = computed(() =>
    this.located().filter((item) => !item.isIotDevice && !item.isEdgeGateway),
  );

  ngOnInit(): void {
    this.environmentId.set(Number(this.route.snapshot.paramMap.get('environmentId')));
    void this.store.loadEnvironments();
    void this.load();
  }

  /**
   * Loads what is located in the environment and the coverage of its Edge Gateways.
   *
   * @returns A promise that resolves when both have been loaded or the load has failed.
   */
  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [located, coverage] = await Promise.all([
        this.store.loadEnvironmentEquipment(this.environmentId()),
        this.store.loadEdgeGatewayCoverage(this.environmentId()),
      ]);
      this.located.set(located);
      this.coverage.set(coverage);
    } catch (error) {
      this.error.set(equipmentError(error));
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Finds the operational status of an Edge Gateway of the coverage.
   *
   * @param equipmentId - The equipment identifier of the Edge Gateway.
   * @returns The status of the Edge Gateway, or `null` if it is not among the located equipment.
   */
  protected gatewayStatus(equipmentId: number): string | null {
    return this.located().find((item) => item.id === equipmentId)?.status ?? null;
  }
}
