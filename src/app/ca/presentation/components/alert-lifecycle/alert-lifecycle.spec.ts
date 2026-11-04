import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AlertStatus } from '../../../domain/model/deviation-alert.entity';
import { AlertLifecycle } from './alert-lifecycle';

describe('AlertLifecycle', () => {
  function stepsOf(status: AlertStatus) {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(AlertLifecycle);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('li'));
  }

  it('marks the steps reached and the current one', () => {
    const steps = stepsOf('ACKNOWLEDGED');

    expect(steps.map((step) => step.classList.contains('reached'))).toEqual([true, true, false]);
    expect(steps.map((step) => step.getAttribute('aria-current'))).toEqual([null, 'step', null]);
  });

  it('names the three steps', () => {
    const steps = stepsOf('UNRESOLVED');

    expect(steps.map((step) => step.textContent?.trim())).toEqual([
      'ca-alerts.status.unresolved',
      'ca-alerts.status.acknowledged',
      'ca-alerts.status.resolved',
    ]);
  });
});
