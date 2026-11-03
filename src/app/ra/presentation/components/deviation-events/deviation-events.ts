import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  imports: [TranslatePipe, DatePipe, DecimalPipe],
  selector: 'app-deviation-events',
  styleUrl: './deviation-events.css',
  templateUrl: './deviation-events.html',
})
export class DeviationEvents {
  readonly trend = input.required<any>();
  readonly points = input<any[] | null>(null);

  protected readonly criticalEvents = computed(() => {
    if (this.points() !== null) return this.points()!;
    return (this.trend().dataPoints || []).filter(
      (p: any) => p.state === 'CRITICAL' || p.state === 'WARNING',
    );
  });
}
