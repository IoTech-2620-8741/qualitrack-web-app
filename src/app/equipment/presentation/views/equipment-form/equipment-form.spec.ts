import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { EquipmentStore } from '../../../application/equipment.store';
import { EquipmentForm } from './equipment-form';

describe('EquipmentForm', () => {
  let component: { form: import('@angular/forms').FormGroup; onSave(): Promise<void> };

  function create() {
    TestBed.configureTestingModule({
      imports: [EquipmentForm],
      providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    vi.spyOn(TestBed.inject(EquipmentStore), 'loadEnvironments').mockResolvedValue(undefined);
    const fixture = TestBed.createComponent(EquipmentForm);
    fixture.detectChanges();
    component = fixture.componentInstance as unknown as typeof component;
    return component.form;
  }

  const valid = { name: 'Autoclave 1', type: 'Autoclave', model: 'AC-200', serialNumber: 'SN-1234', environmentId: null };

  it('accepts valid data', () => {
    const form = create();
    form.setValue(valid);
    expect(form.valid).toBe(true);
  });

  it.each([
    ['name', '   ', 'notBlank'],
    ['name', 'ab', 'minlength'],
    ['model', '   ', 'notBlank'],
    ['serialNumber', 'SN 12', 'pattern'],
  ])('rejects %s = %j with %s', (field, value, error) => {
    const form = create();
    form.setValue({ ...valid, [field]: value });
    expect(form.get(field)?.hasError(error)).toBe(true);
  });

  it('registers the equipment in the environment chosen in the form', async () => {
    const form = create();
    const register = vi.spyOn(TestBed.inject(EquipmentStore), 'registerEquipment').mockResolvedValue({ id: 9, environmentId: 3 } as never);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    form.setValue({ ...valid, environmentId: 3 });
    await component.onSave();
    expect(register).toHaveBeenCalledWith({ name: 'Autoclave 1', type: 'Autoclave', model: 'AC-200', serialNumber: 'SN-1234' }, 3);
    expect(navigate).toHaveBeenCalledWith(['/equipments', 9], { state: { locationError: null } });
  });
});
