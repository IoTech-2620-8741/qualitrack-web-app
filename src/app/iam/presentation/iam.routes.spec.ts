import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { SubscriptionStore } from '../../subscription/application/subscription.store';
import { IamStore } from '../application/iam.store';
import { iamRoutes } from './iam.routes';

describe('iamRoutes sign-up', () => {
  const selectPlan = vi.fn();
  const signedIn = signal(false);

  async function open(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'iam', children: iamRoutes }, { path: 'dashboard', children: [] }]),
        { provide: SubscriptionStore, useValue: { selectPlan } },
        { provide: IamStore, useValue: { isSignedIn: signedIn } },
      ],
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    return router.url;
  }

  beforeEach(() => selectPlan.mockClear());

  it('keeps the plan of the link even when the visitor is already signed in and is sent to the dashboard', async () => {
    signedIn.set(true);
    expect(await open('/iam/sign-up?plan=ENTERPRISE&billingCycle=YEARLY')).toBe('/dashboard');
    expect(selectPlan).toHaveBeenCalledWith({ planCode: 'ENTERPRISE', billingCycle: 'YEARLY' });
  });
});
