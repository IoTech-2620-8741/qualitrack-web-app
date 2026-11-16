import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentStore } from '../../../application/equipment.store';
import { IOT_DEVICE_TYPES, IotDeviceType } from '../../../domain/model/iot-device-type';
import { codeValidator } from '../../../../shared/presentation/validators/code.validator';
import { notBlankValidator } from '../../../../shared/presentation/validators/not-blank.validator';

/** Firmware version such as 1.2, v1.2.3 or 2.0.1-beta.1. */
/** A MAC address: six pairs of hexadecimal digits separated by the same `:` or `-`. */
export const MAC_ADDRESS = /^[0-9A-Fa-f]{2}([:-])(?:[0-9A-Fa-f]{2}\1){4}[0-9A-Fa-f]{2}$/;

/**
 * The MAC address or the serial number of a device: a well-formed MAC address, or a serial number made of letters,
 * digits, `.`, `_`, `/` and `-`. Anything that looks like a MAC address (a `:`, or six pairs separated by `.` or `-`)
 * must be a valid one, so `20.7B.30.33.Z5.99` is refused.
 *
 * @param control - The control with the MAC address or serial number.
 * @returns `{ mac: true }` for a malformed MAC address, `{ code: true }` for a malformed serial number, or `null`.
 */
export function deviceSerialValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value || MAC_ADDRESS.test(value)) return null;
  if (value.includes(':') || /^[0-9A-Za-z]{2}([.-][0-9A-Za-z]{2}){5}$/.test(value)) return { mac: true };
  return codeValidator(control);
}

export const FIRMWARE_VERSION = /^v?\d+(\.\d+){1,3}([-+][0-9A-Za-z.-]+)?$/;

/**
 * Registers an ESP32 environmental device or container monitor and, optionally, the environment
 * where it is installed (US51-US54).
 */
@Component({
  selector: 'app-device-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterModule,
    TranslatePipe,
  ],
  templateUrl: './device-form.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './device-form.css',
})
export class DeviceForm implements OnInit {
  private readonly fb = inject(FormBuilder);

  private readonly router = inject(Router);

  protected readonly store = inject(EquipmentStore);

  protected readonly deviceTypes = IOT_DEVICE_TYPES;

  protected readonly form = this.fb.group({
    deviceType: this.fb.nonNullable.control<IotDeviceType>(
      'ENVIRONMENTAL_DEVICE',
      Validators.required,
    ),
    name: this.fb.nonNullable.control('', [
      Validators.required,
      notBlankValidator,
      Validators.minLength(3),
      Validators.maxLength(150),
    ]),
    sensorExternalId: this.fb.nonNullable.control('', [
      Validators.required,
      notBlankValidator,
      codeValidator,
      Validators.maxLength(50),
    ]),
    serialNumber: this.fb.nonNullable.control('', [
      Validators.required,
      notBlankValidator,
      deviceSerialValidator,
      Validators.maxLength(50),
    ]),
    model: this.fb.nonNullable.control('ESP32', [
      Validators.required,
      notBlankValidator,
      Validators.maxLength(100),
    ]),
    firmwareVersion: this.fb.control<string | null>(null, [
      Validators.pattern(FIRMWARE_VERSION),
      Validators.maxLength(50),
    ]),
    environmentId: this.fb.control<number | null>(null),
  });

  constructor() {
    this.store.clearMessages();
  }

  ngOnInit(): void {
    void this.store.loadEnvironments();
    this.store.loadEquipment();
  }

  /** An environment keeps a single environmental device (US52). */
  protected isOccupied(environmentId: number): boolean {
    return (
      this.form.controls.deviceType.value === 'ENVIRONMENTAL_DEVICE' &&
      this.store
        .iotDevices()
        .some(
          (device) =>
            device.deviceType === 'ENVIRONMENTAL_DEVICE' && device.environmentId === environmentId,
        )
    );
  }

  protected async onSave(): Promise<void> {
    // The button stays usable; pressing it with something missing points at what is missing
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { environmentId, ...command } = this.form.getRawValue();
    const device = await this.store.registerDevice(command, environmentId);
    if (!device) return;
    // A device whose association failed is still registered: its detail explains why and lets it be located again.
    const locationError =
      environmentId !== null && device.environmentId === null ? this.store.error() : null;
    await this.router.navigate(['/equipments', device.id], {
      state: { locationError },
    });
  }
}
