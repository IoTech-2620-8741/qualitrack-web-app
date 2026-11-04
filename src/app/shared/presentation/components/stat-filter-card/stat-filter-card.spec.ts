import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { StatFilterCard } from './stat-filter-card';

describe('StatFilterCard', () => {
  function create() {
    TestBed.configureTestingModule({
      imports: [StatFilterCard],
      providers: [provideTranslateService()],
    });
    const fixture = TestBed.createComponent(StatFilterCard);
    fixture.componentRef.setInput('icon', 'error');
    fixture.componentRef.setInput('labelKey', 'stats.critical');
    fixture.componentRef.setInput('value', 4);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    return { fixture, button };
  }

  it('shows the figure and tells that it is not applied', () => {
    const { button } = create();

    expect(button.querySelector('.value')?.textContent).toBe('4');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.querySelector('.hint')).toBeNull();
  });

  it('tells assistive technology when the filter is applied', () => {
    const { fixture, button } = create();

    fixture.componentRef.setInput('pressed', true);
    fixture.detectChanges();

    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('asks the view to apply the filter', () => {
    const { fixture, button } = create();
    const toggled = vi.fn();
    fixture.componentInstance.toggled.subscribe(toggled);

    button.click();

    expect(toggled).toHaveBeenCalledTimes(1);
  });
});
