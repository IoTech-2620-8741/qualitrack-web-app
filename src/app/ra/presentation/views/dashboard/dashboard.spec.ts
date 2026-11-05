import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';

import { SubscriptionStore } from '../../../../subscription/application/subscription.store';
import { RaStore } from '../../../application/ra.store';
import { PlanSwitchDialog } from '../../components/plan-switch-dialog/plan-switch-dialog';
import { Dashboard } from './dashboard';

describe('Dashboard plan switch notice', () => {
  const catalog = [
    { code: 'BASIC', name: 'Standard Lab', billingPeriod: 'MONTHLY' },
    { code: 'ENTERPRISE', name: 'Enterprise', billingPeriod: 'YEARLY' },
  ];
  const paid = { planCode: 'BASIC', billingCycle: 'MONTHLY', status: 'ACTIVE', currentPeriodEnd: '2026-12-05T20:08:04Z' };
  const selectedPlanCode = signal<string | null>(null);
  const selectedBillingCycle = signal<string | null>(null);
  const subscription = signal<{ status: string; data: unknown }>({ status: 'ready', data: paid });
  const plans = signal<{ status: string; data: unknown }>({ status: 'ready', data: catalog });
  const manages = signal(true);
  const open = vi.fn();
  const clearSelectedPlan = vi.fn(() => {
    selectedPlanCode.set(null);
    selectedBillingCycle.set(null);
  });

  function create() {
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideTranslateService(),
        { provide: MatDialog, useValue: { open } },
        { provide: SubscriptionStore, useValue: { selectedPlanCode, selectedBillingCycle, clearSelectedPlan } },
        {
          provide: RaStore,
          useValue: { reloadOverview: vi.fn(), overviewSubscription: subscription, overviewPlans: plans, managesSubscription: manages },
        },
      ],
    });
    // The notice lives in the class; the template needs most of the store and is not under test here.
    TestBed.overrideComponent(Dashboard, { set: { template: '', imports: [] } });
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    return fixture;
  }

  const choose = (code: string, cycle: string) => {
    selectedPlanCode.set(code);
    selectedBillingCycle.set(cycle);
  };

  beforeEach(() => {
    open.mockClear();
    clearSelectedPlan.mockClear();
    choose('ENTERPRISE', 'YEARLY');
    subscription.set({ status: 'ready', data: paid });
    plans.set({ status: 'ready', data: catalog });
    manages.set(true);
  });

  it('tells an account with another plan how to switch, and forgets the choice', () => {
    create();
    expect(open).toHaveBeenCalledTimes(1);
    const [component, config] = open.mock.calls[0];
    expect(component).toBe(PlanSwitchDialog);
    expect(config.data.chosen).toMatch(/^Enterprise \(/);
    expect(config.data.current).toMatch(/^Standard Lab \(/);
    expect(config.data.periodEnd).toBe('2026-12-05T20:08:04Z');
    expect(clearSelectedPlan).toHaveBeenCalled();
  });

  it('stays quiet, and forgets the choice, when the account already has that plan', () => {
    choose('BASIC', 'MONTHLY');
    create();
    expect(open).not.toHaveBeenCalled();
    expect(clearSelectedPlan).toHaveBeenCalled();
  });

  it('asks the same plan with another billing period, because that is a different plan', () => {
    choose('BASIC', 'YEARLY');
    create();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['nothing was chosen', () => { selectedPlanCode.set(null); selectedBillingCycle.set(null); }],
    ['the account has no subscription', () => subscription.set({ status: 'ready', data: null })],
    ['the subscription is not active', () => subscription.set({ status: 'ready', data: { ...paid, status: 'EXPIRED' } })],
    ['the person does not manage subscriptions', () => manages.set(false)],
    ['the subscription is still loading', () => subscription.set({ status: 'loading', data: null })],
    ['the catalog is still loading', () => plans.set({ status: 'loading', data: null })],
  ])('does not open the notice when %s', (_case, arrange) => {
    arrange();
    create();
    expect(open).not.toHaveBeenCalled();
  });

  it('shows the notice with the codes when the catalog failed to load', () => {
    plans.set({ status: 'error', data: null });
    create();
    expect(open.mock.calls[0][1].data.chosen).toMatch(/^ENTERPRISE \(/);
  });
});
