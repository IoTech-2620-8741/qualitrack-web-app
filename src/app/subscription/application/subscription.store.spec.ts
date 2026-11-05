import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { throwError, of } from 'rxjs';

import { IamStore } from '../../iam/application/iam.store';
import { ApiError } from '../../shared/infrastructure/api-error';
import { SubscriptionApi } from '../infrastructure/subscription-api';
import { SubscriptionStore } from './subscription.store';

describe('SubscriptionStore', () => {
  const beforeSignOut = vi.fn();
  const createCheckoutSession = vi.fn();
  const command = {
    planCode: 'BASIC', billingCycle: 'MONTHLY' as const, userId: 4, laboratoryId: null,
    successUrl: 'http://x/success', cancelUrl: 'http://x/cancel',
  };

  function create() {
    TestBed.configureTestingModule({
      providers: [
        { provide: SubscriptionApi, useValue: { createCheckoutSession } },
        { provide: IamStore, useValue: { beforeSignOut } },
        { provide: Router, useValue: {} },
      ],
    });
    return TestBed.inject(SubscriptionStore);
  }

  beforeEach(() => {
    sessionStorage.clear();
    beforeSignOut.mockClear();
    createCheckoutSession.mockReset();
  });

  it('forgets the chosen plan when the person signs out', () => {
    const store = create();
    store.selectPlan({ planCode: 'BASIC', billingCycle: 'MONTHLY' });
    beforeSignOut.mock.calls[0][0]();
    expect(store.selectedPlanCode()).toBeNull();
    expect(sessionStorage.getItem('selectedPlanCode')).toBeNull();
  });

  it('spends the chosen plan once the checkout session exists', () => {
    createCheckoutSession.mockReturnValue(of({ checkoutUrl: '' }));
    const store = create();
    store.selectPlan({ planCode: 'BASIC', billingCycle: 'MONTHLY' });
    store.createCheckoutSession(command);
    expect(store.selectedPlanCode()).toBeNull();
  });

  it('explains a 409 with the already-subscribed notice and keeps the chosen plan', () => {
    createCheckoutSession.mockReturnValue(throwError(() => new ApiError('Conflict', 409)));
    const store = create();
    store.selectPlan({ planCode: 'BASIC', billingCycle: 'MONTHLY' });
    store.createCheckoutSession(command);
    expect(store.error()).toBe('subscription.plans.already-active');
    expect(store.isLoading()).toBe(false);
    expect(store.selectedPlanCode()).toBe('BASIC');
  });

  it('keeps the generic message for any other failure', () => {
    createCheckoutSession.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const store = create();
    store.createCheckoutSession(command);
    expect(store.error()).toBe('Failed to create checkout session');
  });
});
