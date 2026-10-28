import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { RaStore } from '../../../application/ra.store';
import { calendarDate } from '../../utils/report-period';
import { ReportGeneratorComponent } from './report-generator';

describe('ReportGeneratorComponent', () => {
  const generateComplianceReport = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-02T15:00:00Z'));
    generateComplianceReport.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  function create() {
    TestBed.configureTestingModule({
      imports: [ReportGeneratorComponent],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: IamStore, useValue: { requireLaboratoryId: () => 1 } },
      ],
    });
    vi.spyOn(TestBed.inject(EnvironmentStore), 'loadEnvironments').mockResolvedValue(undefined as never);
    vi.spyOn(TestBed.inject(RaStore), 'generateComplianceReport').mockImplementation(generateComplianceReport);
    const fixture = TestBed.createComponent(ReportGeneratorComponent);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as {
      complianceForm: { startDate: Date | null; endDate: Date | null };
      equipmentForm: { startDate: Date | null; endDate: Date | null };
      complianceError: string | null;
      equipmentError: string | null;
      onGenerateComplianceReport(): void;
    };
  }

  const day = calendarDate;

  it('accepts a period from 2020 up to today', () => {
    const component = create();
    component.complianceForm.startDate = day('2026-09-01');
    component.complianceForm.endDate = day('2026-10-02');
    expect(component.complianceError).toBeNull();
    component.onGenerateComplianceReport();
    expect(generateComplianceReport).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: '2026-09-01', endDate: '2026-10-02' }),
    );
  });

  it.each([
    ['1900-01-01', '2026-10-02', 'minDate'],
    ['2026-09-01', '2026-10-03', 'futureDate'],
    ['2026-10-02', '2026-10-01', 'dateRange'],
    ['2025-10-01', '2026-10-02', 'tooLong'],
  ])('rejects the period %s to %s with %s and does not generate the report', (start, end, error) => {
    const component = create();
    component.complianceForm.startDate = day(start);
    component.complianceForm.endDate = day(end);
    expect(component.complianceError).toBe(error);
    component.onGenerateComplianceReport();
    expect(generateComplianceReport).not.toHaveBeenCalled();
  });

  it('checks the period of the equipment log in the same way', () => {
    const component = create();
    component.equipmentForm.startDate = day('2019-12-31');
    component.equipmentForm.endDate = day('2026-10-02');
    expect(component.equipmentError).toBe('minDate');
    component.equipmentForm.startDate = day('2026-09-01');
    expect(component.equipmentError).toBeNull();
  });
});
