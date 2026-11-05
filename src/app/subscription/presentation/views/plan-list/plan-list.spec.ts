import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionStore } from '../../../application/subscription.store';
import { SubscriptionPlan } from '../../../domain/model/subscription-plan.entity';
import { PlanList } from './plan-list';

describe('PlanList', () => {
  const plan = new SubscriptionPlan({
    id: 2, code: 'BASIC', name: 'Standard Lab', description: '', priceAmount: 1990, currency: 'USD',
    billingPeriod: 'YEARLY', maxUsers: 10, maxEquipment: 5, features: [], active: true,
  });
  const selectedPlan = signal<SubscriptionPlan | null>(null);
  const status = signal<'ACTIVE' | 'INACTIVE' | null>('INACTIVE');
  let navigate: ReturnType<typeof vi.spyOn>;

  function create() {
    TestBed.configureTestingModule({
      imports: [PlanList],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        {
          provide: SubscriptionStore,
          useValue: {
            selectedPlan, plans: signal([plan]), isLoading: signal(false), error: signal(null), loadPlans: vi.fn(),
          },
        },
        {
          provide: IamStore,
          useValue: { isSignedIn: signal(true), onboarding: () => (status() ? { subscriptionStatus: status() } : null) },
        },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(PlanList);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    selectedPlan.set(null);
    status.set('INACTIVE');
  });

  it('goes straight to the checkout of a plan chosen before, while the account has no subscription', () => {
    selectedPlan.set(plan);
    create();
    expect(navigate).toHaveBeenCalledWith(['/subscriptions/checkout'], {
      queryParams: { plan: 'BASIC', billingCycle: 'YEARLY' },
    });
  });

  it('shows the plans when nothing was chosen', () => {
    create();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not open a checkout for an account that already has a subscription', () => {
    selectedPlan.set(plan);
    status.set('ACTIVE');
    create();
    expect(navigate).not.toHaveBeenCalled();
  });
});
