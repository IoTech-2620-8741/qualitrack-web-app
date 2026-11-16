import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ReportGeneratorState } from '../../views/report-generator/report-generator.state';
import { ReportParamsForm } from './report-params-form';

describe('ReportParamsForm', () => {
  function create() {
    TestBed.configureTestingModule({
      imports: [ReportParamsForm],
      providers: [ReportGeneratorState, provideTranslateService(), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(ReportParamsForm);
    const state = TestBed.inject(ReportGeneratorState);
    const footer = () => {
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement).querySelector('.panel-footer')!.textContent!;
    };
    return { state, footer };
  }

  it('says what the report still needs while it cannot be generated', () => {
    const { state, footer } = create();
    expect(footer()).toContain('report-generator.missing.period');

    state.updateForm({ startDate: new Date(2026, 9, 1), endDate: new Date(2026, 9, 31) });
    expect(footer()).not.toContain('report-generator.missing');

    state.setType('equipment');
    expect(footer()).toContain('report-generator.missing.equipment');

    state.setType('batch');
    expect(footer()).toContain('report-generator.missing.batch');
    state.updateForm({ batchId: 7 });
    expect(footer()).not.toContain('report-generator.missing');
  });

  it('labels the preview with text', () => {
    const { footer } = create();
    expect(footer()).toContain('report-generator.preview');
  });
});
