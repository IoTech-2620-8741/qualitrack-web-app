import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentStore } from '../../../application/equipment.store';
import { Equipment } from '../../../domain/model/equipment.entity';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { CalibrationAlert } from '../calibration-alert/calibration-alert';

/** Which equipment the list shows: everything, process equipment or IoT devices. */
type EquipmentFilter = 'all' | 'equipment' | 'devices';

/**
 * Equipment and IoT devices of the laboratory with their location and status (US46).
 */
@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    CalibrationAlert,
    RouterModule,
    TranslatePipe,
  ],
  templateUrl: './equipment-list.html',
  styleUrl: './equipment-list.css',
})
export class EquipmentList implements OnInit {
  protected readonly store = inject(EquipmentStore);

  private readonly environments = inject(EnvironmentStore);

  protected readonly filter = signal<EquipmentFilter>('all');

  protected readonly displayedColumns: string[] = ['name', 'type', 'environment', 'serialNumber', 'status', 'actions'];

  protected readonly visibleEquipment = computed(() => {
    switch (this.filter()) {
      case 'equipment':
        return this.store.processEquipment();
      case 'devices':
        return this.store.iotDevices();
      default:
        return this.store.equipmentList();
    }
  });

  ngOnInit(): void {
    this.store.loadEquipment();
    void this.environments.loadEnvironments();
  }

  protected onRefresh(): void {
    this.store.loadEquipment();
  }

  /** Name of the environment where the equipment is located, if it is known. */
  protected environmentName(equipment: Equipment): string | null {
    if (equipment.environmentId === null) return null;
    return this.environments.environments().find((environment) => environment.id === equipment.environmentId)?.name
      ?? `#${equipment.environmentId}`;
  }
}
