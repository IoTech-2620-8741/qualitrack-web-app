import { TestBed } from '@angular/core/testing';
import { MatCheckbox } from '@angular/material/checkbox';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { InventoryFilters } from './inventory-filters';

describe('InventoryFilters', () => {
  const open = () => {
    TestBed.configureTestingModule({ imports: [InventoryFilters], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(InventoryFilters);
    fixture.componentRef.setInput('search', '');
    fixture.componentRef.setInput('lowOnly', false);
    fixture.detectChanges();
    return fixture;
  };

  it('tells the text the user searches', () => {
    const fixture = open();
    const searched: string[] = [];
    fixture.componentInstance.searchChange.subscribe((text) => searched.push(text));
    const input = (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;
    input.value = 'lactosa';
    input.dispatchEvent(new Event('input'));
    expect(searched).toEqual(['lactosa']);
  });

  it('tells when the user turns on the low stock filter', () => {
    const fixture = open();
    const changes: boolean[] = [];
    fixture.componentInstance.lowOnlyChange.subscribe((checked) => changes.push(checked));
    fixture.debugElement.query(By.directive(MatCheckbox)).triggerEventHandler('change', { checked: true });
    expect(changes).toEqual([true]);
  });
});
