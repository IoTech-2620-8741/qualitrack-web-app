import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { todayInLima } from '../../../../shared/presentation/utils/local-date';
import { BatchStore } from '../../../application/batch.store';
import { BatchDecisionDialog } from '../../components/batch-decision-dialog/batch-decision-dialog';
import { BatchReleaseForm } from './batch-release-form';

describe('BatchReleaseForm', () => {
  let answer: boolean | undefined;
  const dialog = { open: vi.fn(() => ({ afterClosed: () => of(answer) })) };

  function create(startDate: string | null = '2026-09-01') {
    TestBed.configureTestingModule({
      imports: [BatchReleaseForm],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: IamStore, useValue: { requireLaboratoryId: () => 1, canManageQuality: () => true, canOperate: () => true } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '5' } } } },
        { provide: MatDialog, useValue: dialog },
      ],
    });
    const store = TestBed.inject(BatchStore);
    vi.spyOn(store, 'selectedBatch').mockReturnValue(startDate ? ({ id: 5, startDate } as never) : null);
    const fixture = TestBed.createComponent(BatchReleaseForm);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as {
      form: import('@angular/forms').FormGroup;
      minDate: string;
      maxDate: string;
      submit(): Promise<void>;
    };
  }

  const text = 'Quality control approved the batch';

  it('starts today and accepts a date from the start of the batch up to today', () => {
    const { form } = create();
    expect(form.get('releaseDate')?.value).toBe(todayInLima());
    form.setValue({ releaseDate: '2026-09-01', notes: text });
    expect(form.valid).toBe(true);
  });

  it.each([
    ['1900-01-01', 'minDate'],
    ['2019-12-31', 'minDate'],
    ['2999-01-01', 'futureDate'],
    ['2026-08-31', 'dateOrder'],
    ['2026-02-30', 'invalidDate'],
  ])('rejects the date %s with %s', (date, error) => {
    const { form } = create();
    form.setValue({ releaseDate: date, notes: text });
    expect(form.get('releaseDate')?.hasError(error)).toBe(true);
  });

  it('does not compare with the start of the batch while it is not loaded', () => {
    const { form } = create(null);
    form.setValue({ releaseDate: '2020-01-01', notes: text });
    expect(form.get('releaseDate')?.valid).toBe(true);
  });

  it('rejects text made only of spaces', () => {
    const { form } = create();
    form.setValue({ releaseDate: '2026-09-01', notes: ' '.repeat(20) });
    expect(form.get('notes')?.hasError('notBlank')).toBe(true);
  });

  it('limits the date input from the start of the batch to today', () => {
    const component = create();
    expect(component.minDate).toBe('2026-09-01');
    expect(component.maxDate).toBe(todayInLima());
  });

  it('limits the date input to 2020 while the batch is not loaded', () => {
    expect(create(null).minDate).toBe('2020-01-01');
  });

  it.each([
    [undefined, 0],
    [true, 1],
  ])('asks to confirm on a dialog that names the batch and only goes on when confirmed (%s)', async (reply, calls) => {
    answer = reply;
    dialog.open.mockClear();
    const component = create();
    const decide = vi.spyOn(TestBed.inject(BatchStore), 'releaseBatch').mockResolvedValue(false);
    component.form.setValue({ releaseDate: '2026-09-01', notes: text });
    await component.submit();
    expect(dialog.open).toHaveBeenCalledWith(BatchDecisionDialog, {
      data: { decision: 'release', batch: expect.objectContaining({ id: 5 }) },
    });
    expect(decide).toHaveBeenCalledTimes(calls);
  });
});
