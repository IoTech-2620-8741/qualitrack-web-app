import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { EquipmentStore } from '../../../application/equipment.store';
import { BpmConfigForm } from './bpm-config-form';

describe('BpmConfigForm', () => {
  const configureBpm = vi.fn();
  const loadEquipmentById = vi.fn().mockResolvedValue(null);

  /** Creates the form; with `readsEquipment` the page reads its equipment from the API instead of a stub. */
  function create({ readsEquipment = false } = {}) {
    TestBed.configureTestingModule({
      imports: [BpmConfigForm],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '4' } } } },
      ],
    });
    vi.spyOn(TestBed.inject(EquipmentStore), 'configureBpm').mockImplementation(configureBpm);
    if (readsEquipment) vi.spyOn(TestBed.inject(IamStore), 'requireLaboratoryId').mockReturnValue(42);
    else vi.spyOn(TestBed.inject(EquipmentStore), 'loadEquipmentById').mockImplementation(loadEquipmentById);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(BpmConfigForm);
    fixture.detectChanges();
    return Object.assign(fixture.componentInstance as unknown as {
      form: import('@angular/forms').FormGroup;
      onSave(): void;
    }, { fixture });
  }

  const valid = { parameterName: 'TEMPERATURE', minValue: 2, maxValue: 8, unit: 'Celsius' };

  /** Contenedor PT-B1, a container monitor located in environment 1, as the API returns it. */
  const containerMonitor = {
    id: 4,
    laboratoryId: 42,
    environmentId: 1,
    name: 'Contenedor PT-B1',
    type: 'CONTAINER_MONITOR',
    model: 'ESP32-S3 + SHT31 + BH1750 + RC522',
    serialNumber: 'SN-CTN-24012',
    status: 'OPERATIONAL',
    deviceType: 'CONTAINER_MONITOR',
    sensorExternalId: 'ESP32-CTN-PTB1',
    firmwareVersion: '2.1.0',
    createdAt: '2026-09-01T10:00:00Z',
  };

  /** Process equipment without telemetry, as the API returns it. */
  const autoclave = {
    ...containerMonitor,
    name: 'Autoclave AV-200',
    type: 'Autoclave',
    model: 'Tuttnauer 3870EL',
    serialNumber: 'TT-3870-1182',
    deviceType: null,
    sensorExternalId: null,
    firmwareVersion: null,
  };

  /** Answers the request for equipment 4 with the given equipment and renders the page. */
  async function answerEquipment(fixture: ComponentFixture<BpmConfigForm>, equipment: object) {
    TestBed.inject(HttpTestingController).expectOne((request) => request.url.endsWith('/equipments/4')).flush(equipment);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => configureBpm.mockClear());

  it('accepts valid data, including negative limits', () => {
    const { form } = create();
    form.setValue(valid);
    expect(form.valid).toBe(true);
    form.setValue({ ...valid, minValue: -80, maxValue: -60 });
    expect(form.valid).toBe(true);
  });

  it.each([
    [{ minValue: 8, maxValue: 8 }],
    [{ minValue: 9, maxValue: 8 }],
    [{ minValue: 2.5, maxValue: -1 }],
  ])('rejects the range %j', range => {
    const { form } = create();
    form.setValue({ ...valid, ...range });
    expect(form.hasError('bpmRange')).toBe(true);
  });

  it.each([
    ['parameterName', '   ', 'notBlank'],
    ['parameterName', 'x'.repeat(101), 'maxlength'],
    ['unit', '   ', 'notBlank'],
    ['unit', 'x'.repeat(21), 'maxlength'],
    ['minValue', -1_000_001, 'min'],
    ['maxValue', 1_000_001, 'max'],
  ])('rejects %s = %j with %s', (field, value, error) => {
    const { form } = create();
    form.setValue({ ...valid, [field]: value });
    expect(form.get(field)?.hasError(error)).toBe(true);
  });

  it('does not send a range where the minimum is not lower than the maximum', () => {
    const component = create();
    component.form.setValue({ ...valid, minValue: 8, maxValue: 2 });
    component.onSave();
    expect(configureBpm).not.toHaveBeenCalled();
  });

  it('sends a valid configuration', () => {
    const component = create();
    component.form.setValue(valid);
    component.onSave();
    expect(configureBpm).toHaveBeenCalled();
  });

  it('loads the equipment the parameter belongs to', () => {
    create();
    expect(loadEquipmentById).toHaveBeenCalledWith(4);
  });

  it('accepts any parameter name without offering monitored variables', async () => {
    const { form, fixture } = create({ readsEquipment: true });
    await answerEquipment(fixture, autoclave);
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[formcontrolname="parameterName"]');
    input.dispatchEvent(new Event('focusin'));
    fixture.detectChanges();
    expect(document.querySelectorAll('mat-option').length).toBe(0);
    form.patchValue({ parameterName: 'Presión', minValue: 1, maxValue: 2.2, unit: 'bar' });
    expect(form.valid).toBe(true);
  });

  it('points an IoT device to its thresholds instead of the form', async () => {
    const { fixture } = create({ readsEquipment: true });
    await answerEquipment(fixture, containerMonitor);

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('form')).toBeNull();
    expect(element.textContent).toContain('bpm-config.iot-device');
  });

  it('shows neither the form nor the notice while the equipment loads', () => {
    const { fixture } = create({ readsEquipment: true });

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('form')).toBeNull();
    expect(element.textContent).not.toContain('bpm-config.iot-device');
  });

  it('keeps the form hidden when the equipment cannot be read', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { fixture } = create({ readsEquipment: true });
    TestBed.inject(HttpTestingController)
      .expectOne((request) => request.url.endsWith('/equipments/4'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('.error')).not.toBeNull();
  });
});
