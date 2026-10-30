import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService} from '@ngx-translate/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./app.css'],
})
export class App {
  protected readonly title = signal('QualiTrack | IoTech');
  private translate = inject(TranslateService);

  constructor() {
    this.translate.addLangs(['en', 'es']);
    this.translate.use('en');
    document.documentElement.lang = 'en';
  }
}
