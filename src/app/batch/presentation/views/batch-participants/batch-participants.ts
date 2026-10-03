import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { BatchStore, batchError } from '../../../application/batch.store';
import { BatchPath } from '../../../infrastructure/batch-api-endpoint';
import { EquipmentApi } from '../../../../equipment/infrastructure/equipment-api';
import { Equipment } from '../../../../equipment/domain/model/equipment.entity';
import { LaboratoryApi } from '../../../../laboratory/infrastructure/laboratory-api';
import { StaffMember } from '../../../../laboratory/domain/model/staff-member.entity';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Equipment (US76) and staff (US77) that took part in a batch, with the association forms while it is open.
 *
 * @remarks
 * Only operational equipment can be selected; the backend rejects equipment in maintenance or out of
 * service and associations that already exist.
 */
@Component({
  selector: 'app-batch-participants',
  standalone: true,
  imports: [DatePipe, FormsModule, MatButtonModule, MatIconModule, MatSelectModule, TranslateModule],
  templateUrl: './batch-participants.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class BatchParticipants implements OnInit {
  readonly path = input.required<BatchPath>();
  readonly batchId = input.required<number>();
  readonly open = input(false);
  protected readonly store = inject(BatchStore);
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly laboratoryApi = inject(LaboratoryApi);
  private readonly iam = inject(IamStore);
  protected readonly equipment = signal<Equipment[]>([]);
  protected readonly staff = signal<StaffMember[]>([]);
  protected readonly loadError = signal<string | null>(null);
  protected equipmentId: number | null = null;
  protected staffId: number | null = null;
  /** Operational equipment not associated with the batch yet. */
  protected readonly availableEquipment = computed(() => {
    const used = new Set((this.store.traceability()?.equipment ?? []).map((usage) => usage.equipmentId));
    return this.equipment().filter((item) => item.status === 'OPERATIONAL' && !used.has(item.id));
  });
  /** Active staff members not associated with the batch yet. */
  protected readonly availableStaff = computed(() => {
    const joined = new Set((this.store.traceability()?.staff ?? []).map((participation) => participation.staffId));
    return this.staff().filter((member) => member.active && !joined.has(member.id));
  });

  async ngOnInit(): Promise<void> {
    if (!this.open()) return;
    const laboratoryId = this.iam.requireLaboratoryId();
    try {
      const [equipment, staff] = await Promise.all([
        firstValueFrom(this.equipmentApi.getEquipment(laboratoryId)),
        firstValueFrom(this.laboratoryApi.getStaff(laboratoryId)),
      ]);
      this.equipment.set(equipment.filter((item) => item.labId === laboratoryId));
      this.staff.set(staff);
    } catch (error) {
      this.loadError.set(batchError(error));
    }
  }

  protected async addEquipment(): Promise<void> {
    if (this.equipmentId === null) return;
    if (await this.store.registerEquipment(this.path(), this.batchId(), this.equipmentId)) this.equipmentId = null;
  }

  protected async addStaff(): Promise<void> {
    if (this.staffId === null) return;
    if (await this.store.registerStaff(this.path(), this.batchId(), this.staffId)) this.staffId = null;
  }
}
