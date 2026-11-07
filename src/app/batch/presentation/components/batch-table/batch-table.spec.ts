import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Batch } from '../../../domain/model/batch.entity';
import { BatchTable } from './batch-table';

describe('BatchTable', () => {
  function batches(count: number): Batch[] {
    return Array.from(
      { length: count },
      (_, index) =>
        new Batch({
          id: index + 1,
          labId: 42,
          environmentId: index === 0 ? null : 1,
          productId: 5,
          productName: 'Ibuprofen 400 mg',
          batchNumber: `LOT-${String(index + 1).padStart(2, '0')}`,
          quantity: 100,
          unit: 'units',
          status: 'PENDING',
          startDate: '2026-10-01',
        }),
    );
  }

  function create(count: number) {
    TestBed.configureTestingModule({
      imports: [BatchTable],
      providers: [provideTranslateService(), provideRouter([])],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(BatchTable);
    fixture.componentRef.setInput('batches', batches(count));
    fixture.componentRef.setInput('environments', [{ id: 1, code: 'PRD-01', name: 'Production' }]);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    return { fixture, element, navigate };
  }

  it('shows ten batches per page with the paginator when there are more', () => {
    const { element } = create(12);

    expect(element.querySelectorAll('tr[mat-row]').length).toBe(10);
    expect(element.querySelector('mat-paginator')).not.toBeNull();
  });

  it('does not show the paginator when every batch fits in one page', () => {
    const { element } = create(3);

    expect(element.querySelectorAll('tr[mat-row]').length).toBe(3);
    expect(element.querySelector('mat-paginator')).toBeNull();
    expect(element.textContent).toContain('PRD-01');
  });

  it('opens a batch from its row, but not a batch without environment', () => {
    const { element, navigate } = create(3);
    const rows = [...element.querySelectorAll('tr[mat-row]')] as HTMLElement[];

    rows[1]
      .querySelector('td:nth-child(3)')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    rows[0]
      .querySelector('td:nth-child(3)')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith([
      '/batches/environments',
      1,
      'products',
      5,
      'batches',
      2,
    ]);
    expect(rows[0].classList.contains('openable')).toBe(false);
  });
});
