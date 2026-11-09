import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { InventoryCatalogueStats } from './inventory-catalogue-stats';

describe('InventoryCatalogueStats', () => {
  it('shows the number of materials and how many are low on stock', () => {
    TestBed.configureTestingModule({
      imports: [InventoryCatalogueStats],
      providers: [provideTranslateService()],
    });
    const fixture = TestBed.createComponent(InventoryCatalogueStats);
    fixture.componentRef.setInput('materialsCount', 12);
    fixture.componentRef.setInput('lowStockCount', 3);
    fixture.detectChanges();

    const figures = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('.summary-strip div'),
    ].map((figure) => [
      figure.querySelector('span')?.textContent,
      figure.querySelector('strong')?.textContent,
    ]);

    expect(figures).toEqual([
      ['inventory.materials', '12'],
      ['inventory.lowStock', '3'],
    ]);
  });
});
