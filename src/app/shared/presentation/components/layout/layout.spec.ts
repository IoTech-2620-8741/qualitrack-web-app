import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Layout } from './layout';

describe('Layout', () => {
  function brandLink(signedIn: boolean): string | null {
    TestBed.configureTestingModule({
      imports: [Layout],
      providers: [provideTranslateService(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(Layout);
    fixture.componentRef.setInput('isSignedIn', signedIn);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('a.brand')?.getAttribute('href') ?? null;
  }

  it('leads the logo to the home page before signing in', () => {
    expect(brandLink(false)).toBe('/home');
  });

  it('leads the logo to the dashboard once signed in', () => {
    expect(brandLink(true)).toBe('/dashboard');
  });
});
