import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EquipmentStore } from '../../../application/equipment.store';
import { Equipment } from '../../../domain/model/equipment.entity';
import { ATTENTION_STATUSES } from '../../../domain/model/equipment-status';

/** Which equipment the list shows: everything, process equipment, IoT devices or Edge Gateways. */
type EquipmentFilter = 'all' | 'equipment' | 'devices' | 'gateways';

/**
 * Equipment, IoT devices and Edge Gateways of the laboratory with their location and status (US46).
 *
 * @remarks
 * Equipment in maintenance or out of service is counted in the summary and can be filtered,
 * like low stock materials in the inventory. The list can also be narrowed to one environment;
 * the `environmentId` query parameter opens it already filtered.
 */
@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
    MatTooltipModule
  ],
  templateUrl: './equipment-list.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './equipment-list.css',
})
export class EquipmentList implements OnInit {
  protected readonly store = inject(EquipmentStore);

  protected readonly filter = signal<EquipmentFilter>('all');

  protected readonly search = signal('');

  protected readonly attentionOnly = signal(false);

  /** Identifier of the environment the list is narrowed to, or `null` to show every environment. */
  protected readonly environmentId = signal<number | null>(readEnvironmentId(inject(ActivatedRoute)));

  /** Equipment of the chosen environment, or of every environment; the summary counts it. */
  protected readonly scopedEquipment = computed(() => {
    const environmentId = this.environmentId();
    return this.store
      .equipmentList()
      .filter((equipment) => environmentId === null || equipment.environmentId === environmentId);
  });

  /** Counters of the summary, for the chosen environment. */
  protected readonly summary = computed(() => {
    const equipment = this.scopedEquipment();
    return {
      equipment: equipment.filter((item) => !item.isIotDevice && !item.isEdgeGateway).length,
      devices: equipment.filter((item) => item.isIotDevice).length,
      gateways: equipment.filter((item) => item.isEdgeGateway).length,
      attention: equipment.filter((item) => this.needsAttention(item)).length,
    };
  });

  protected readonly visibleEquipment = computed(() => {
    const kind = this.filter();
    const text = this.search().trim().toLowerCase();
    return this.scopedEquipment()
      .filter(
        (equipment) =>
          kind === 'all' ||
          (kind === 'equipment' && !equipment.isIotDevice && !equipment.isEdgeGateway) ||
          (kind === 'devices' && equipment.isIotDevice) ||
          (kind === 'gateways' && equipment.isEdgeGateway),
      )
      .filter((equipment) => !this.attentionOnly() || this.needsAttention(equipment))
      .filter(
        (equipment) =>
          !text ||
          [
            equipment.name,
            equipment.model,
            equipment.serialNumber,
            equipment.sensorExternalId ?? '',
          ].some((value) => value.toLowerCase().includes(text)),
      );
  });

  ngOnInit(): void {
    this.store.loadEquipment();
    void this.store.loadEnvironments();
  }

  protected reload(): void {
    this.store.loadEquipment();
  }

  protected needsAttention(equipment: Equipment): boolean {
    return ATTENTION_STATUSES.includes(equipment.status);
  }

  /** Name of the environment where the equipment is located, if it is known. */
  protected environmentName(equipment: Equipment): string | null {
    if (equipment.environmentId === null) return null;
    const environment = this.store.environments().find((item) => item.id === equipment.environmentId);
    return environment
      ? `${environment.code} · ${environment.name}`
      : `#${equipment.environmentId}`;
  }
}

/**
 * Reads the environment the list must open filtered by.
 *
 * @param route - The active route, whose `environmentId` query parameter is read.
 * @returns The identifier of the environment, or `null` if the parameter is missing or is not a positive integer.
 */
function readEnvironmentId(route: ActivatedRoute): number | null {
  const value = Number(route.snapshot.queryParamMap.get('environmentId'));
  return Number.isInteger(value) && value > 0 ? value : null;
}
