import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { BatchDecisionDialog } from './batch-decision-dialog';

describe('BatchDecisionDialog', () => {
  it('names the batch in the title and in the confirm button', () => {
    TestBed.configureTestingModule({
      imports: [BatchDecisionDialog],
      providers: [
        provideTranslateService(),
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            decision: 'release',
            batch: { batchNumber: 'IBU400-2610-01', productName: 'Ibuprofeno 400 mg', quantity: 40000, unit: 'units' },
          },
        },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      'batch-release': {
        'confirm-title': 'Release batch {{batch}}?',
        'confirm-action': 'Release {{batch}}',
        notice: 'The batch can no longer be modified.',
      },
    });
    translate.use('en');
    const fixture = TestBed.createComponent(BatchDecisionDialog);
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Release batch IBU400-2610-01?');
    expect(text).toContain('Release IBU400-2610-01');
    expect(text).toContain('Ibuprofeno 400 mg · 40,000 units');
  });
});
