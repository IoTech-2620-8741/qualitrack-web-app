import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AlertsPageHeader, AlertsSection } from './alerts-page-header';

@Component({
  imports: [AlertsPageHeader],
  template: `
    <app-alerts-page-header
      [section]="section()"
      subtitleKey="alerts.subtitle"
      [activeCount]="activeCount()"
      [environmentId]="environmentId()"
    >
      <button type="button" class="page-action">Action</button>
      <section alertsSection class="page-content">Content</section>
    </app-alerts-page-header>
  `,
})
class HostPage {
  readonly section = signal<AlertsSection>('active');
  readonly activeCount = signal<number | null>(null);
  readonly environmentId = signal<number | null>(null);
}

describe('AlertsPageHeader', () => {
  function create() {
    TestBed.configureTestingModule({
      imports: [HostPage],
      providers: [provideRouter([]), provideTranslateService()],
    });
    const fixture = TestBed.createComponent(HostPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const tabs = () => Array.from(element.querySelectorAll<HTMLAnchorElement>('[mat-tab-link]'));
    return { fixture, element, tabs };
  }

  it('links the two sections and marks the one of the page', () => {
    const { fixture, tabs } = create();

    expect(tabs().map((tab) => tab.getAttribute('href'))).toEqual(['/alerts', '/alerts/history']);
    expect(tabs()[0].classList).toContain('mdc-tab--active');

    fixture.componentInstance.section.set('history');
    fixture.detectChanges();
    expect(tabs()[1].classList).toContain('mdc-tab--active');
  });

  it('shows the count of open alerts only when there are some', () => {
    const { fixture, element } = create();
    expect(element.querySelector('.tab-count')).toBeNull();

    fixture.componentInstance.activeCount.set(0);
    fixture.detectChanges();
    expect(element.querySelector('.tab-count')).toBeNull();

    fixture.componentInstance.activeCount.set(4);
    fixture.detectChanges();
    expect(element.querySelector('.tab-count')?.textContent).toBe('4');
  });

  it('keeps the chosen environment in the links of the tabs', () => {
    const { fixture, tabs } = create();

    fixture.componentInstance.environmentId.set(5);
    fixture.detectChanges();

    expect(tabs().map((tab) => tab.getAttribute('href'))).toEqual([
      '/alerts?environmentId=5',
      '/alerts/history?environmentId=5',
    ]);
  });

  it('places the actions and the content of the page', () => {
    const { element } = create();

    expect(element.querySelector('.actions .page-action')).not.toBeNull();
    expect(element.querySelector('mat-tab-nav-panel .page-content')).not.toBeNull();
    expect(element.querySelector('.actions')?.textContent).toContain('ca-alerts.page.preferences');
  });
});
