import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { switchMap, timer } from 'rxjs';

import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotificationStore } from '../../../application/notification.store';
import { Notification } from '../../../domain/model/notification.entity';

/** How often the bell asks for the unread count. */
const REFRESH_INTERVAL_MS = 30_000;

/** Variables with a translated name. */
const KNOWN_METRICS = new Set(['AIR_QUALITY', 'TEMPERATURE', 'HUMIDITY', 'LUMINOSITY']);

/**
 * Bell of the toolbar with the notifications of the signed-in user (US83). It opens a small panel over the current
 * view, so the person does not leave what they are doing.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    RouterLink,
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    TranslateModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css',
})
export class NotificationBell {
  protected readonly store = inject(NotificationStore);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  protected readonly open = signal(false);

  /** Below the bell, aligned to its right edge; above it when there is no room below. */
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
  ];

  constructor() {
    timer(0, REFRESH_INTERVAL_MS).pipe(
      switchMap(() => this.store.refreshUnreadCount()),
      takeUntilDestroyed(),
    ).subscribe();
  }

  protected badge(): string {
    const count = this.store.unreadCount();
    return count > 99 ? '99+' : String(count);
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.open.set(true);
    this.store.loadLatest();
  }

  protected close(): void {
    this.open.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.close();
  }

  /** Marks the notification as read and shows the alert or the batch it is about. */
  protected openNotification(notification: Notification): void {
    this.store.markAsRead(notification);
    this.close();
    void this.router.navigate(notification.link);
  }

  /** Values of the message of a notification, already translated. */
  protected params(notification: Notification): Record<string, unknown> {
    const variable = notification.parameterName && KNOWN_METRICS.has(notification.parameterName)
      ? this.translate.instant(`tracking.metrics.${notification.parameterName}`)
      : notification.parameterName ?? '';
    return {
      severity: notification.severity ? this.translate.instant(`notifications.severity.${notification.severity}`) : '',
      level: notification.severity ? this.translate.instant(`notifications.level.${notification.severity}`) : '',
      variable,
      environment: notification.environmentName ?? this.translate.instant('notifications.unknown-environment'),
      device: notification.subjectName ?? '',
      batch: notification.subjectName ?? '',
      value: notification.recordedValue === null ? '' : this.formatNumber(notification.recordedValue),
      unit: notification.unit ?? '',
      actor: notification.actorName ?? this.translate.instant('notifications.someone'),
      note: notification.note ?? '',
    };
  }

  protected tone(notification: Notification): string {
    if (notification.type === 'BATCH_REJECTED') return 'tone-critical';
    if (notification.type === 'ALERT_OPENED' || notification.type === 'ALERT_ESCALATED') {
      return notification.severity === 'CRITICAL' ? 'tone-critical' : 'tone-warning';
    }
    return 'tone-done';
  }

  /** "5 min ago", "yesterday"… in the language of the person; the date for older notifications. */
  protected timeAgo(isoDate: string): string {
    const language = this.translate.getCurrentLang() || 'en';
    const minutes = Math.round((Date.parse(isoDate) - Date.now()) / 60_000);
    if (Math.abs(minutes) < 1) return this.translate.instant('notifications.just-now');
    const relative = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
    if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute');
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return relative.format(hours, 'hour');
    const days = Math.round(hours / 24);
    if (Math.abs(days) < 7) return relative.format(days, 'day');
    return new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(new Date(isoDate));
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat(this.translate.getCurrentLang() || 'en', { maximumFractionDigits: 2 }).format(value);
  }
}
