import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { OverviewPlan } from '../../../domain/model/overview-plan.entity';
import { OverviewSubscription } from '../../../domain/model/overview-subscription.entity';
import { DashboardSubscription } from './dashboard-subscription';

describe('DashboardSubscription', () => {
  const planWith = (maxEquipment: number | null) =>
    new OverviewPlan({
      code: 'BASIC',
      name: 'Standard Lab',
      billingPeriod: 'MONTHLY',
      priceAmount: 199,
      currency: 'USD',
      maxEquipment,
    });

  function render(maxEquipment: number | null, iotDeviceCount: number | null) {
    TestBed.configureTestingModule({
      imports: [DashboardSubscription],
      providers: [provideRouter([]), provideTranslateService()],
    });
    const fixture = TestBed.createComponent(DashboardSubscription);
    fixture.componentRef.setInput('status', 'ready');
    fixture.componentRef.setInput(
      'subscription',
      new OverviewSubscription({
        laboratoryId: 1,
        planCode: 'BASIC',
        billingCycle: 'MONTHLY',
        status: 'ACTIVE',
        currentPeriodEnd: null,
      }),
    );
    fixture.componentRef.setInput('currentPlan', planWith(maxEquipment));
    fixture.componentRef.setInput('plansStatus', 'ready');
    fixture.componentRef.setInput('formatDate', (value: string | number) => String(value));
    fixture.componentRef.setInput('iotDeviceCount', iotDeviceCount);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the IoT devices against the allowance of the plan', () => {
    const element = render(5, 3);

    expect(element.textContent).toContain('dashboard.overview.iot-devices-usage');
    expect(element.querySelector('.limit-warning')).toBeNull();
  });

  it('warns when the laboratory reached the IoT devices its plan allows', () => {
    const element = render(5, 6);

    expect(element.querySelector('.limit-reached')).not.toBeNull();
    expect(element.querySelector('.limit-warning')?.textContent).toContain('dashboard.overview.iot-limit-reached');
  });

  it('never warns for a plan without limit', () => {
    const element = render(null, 40);

    expect(element.textContent).toContain('dashboard.overview.iot-devices-unlimited');
    expect(element.querySelector('.limit-warning')).toBeNull();
  });
});
