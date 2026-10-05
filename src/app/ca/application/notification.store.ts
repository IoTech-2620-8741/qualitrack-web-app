import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, of, tap } from 'rxjs';

import { Notification } from '../domain/model/notification.entity';
import { CaApi } from '../infrastructure/ca-api';
import { IamStore } from '../../iam/application/iam.store';

/** Notifications shown when the bell opens. */
const PANEL_SIZE = 15;

/**
 * Application store of the notifications of the signed-in user (US83): the unread count of the bell in the toolbar
 * and the latest notifications of its panel.
 *
 * @remarks
 * Provided in root so that the toolbar keeps the count while the person moves between views. Everything is cleared
 * when another person signs in.
 */
@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly caApi = inject(CaApi);
  private readonly iam = inject(IamStore);

  private readonly unreadCountSignal = signal(0);
  private readonly notificationsSignal = signal<Notification[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal(false);

  /** Notifications the person has not read. */
  readonly unreadCount = this.unreadCountSignal.asReadonly();

  /** Latest notifications, newest first. */
  readonly notifications = this.notificationsSignal.asReadonly();

  readonly loading = this.loadingSignal.asReadonly();

  /** Whether the latest notifications could not be loaded. */
  readonly failed = this.errorSignal.asReadonly();

  readonly hasUnread = computed(() => this.unreadCount() > 0);

  constructor() {
    effect(() => {
      this.iam.currentUserId();
      this.unreadCountSignal.set(0);
      this.notificationsSignal.set([]);
    });
  }

  /** Updates the count of the bell; a failure keeps the last count. */
  refreshUnreadCount(): Observable<number> {
    return this.caApi.getUnreadNotificationCount().pipe(
      tap((count) => this.unreadCountSignal.set(count)),
      catchError(() => of(this.unreadCountSignal())),
    );
  }

  /** Loads the latest notifications for the panel of the bell. */
  loadLatest(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(false);
    this.caApi.getNotifications(false, PANEL_SIZE).pipe(
      finalize(() => this.loadingSignal.set(false)),
    ).subscribe({
      next: (notifications) => {
        this.notificationsSignal.set(notifications);
        this.refreshUnreadCount().subscribe();
      },
      error: () => this.errorSignal.set(true),
    });
  }

  /** Marks a notification as read when the person opens it. */
  markAsRead(notification: Notification): void {
    if (notification.isRead) return;
    this.caApi.markNotificationAsRead(notification.id).subscribe({
      next: (read) => {
        this.notificationsSignal.update((current) => current.map((item) => item.id === read.id ? read : item));
        this.unreadCountSignal.update((count) => Math.max(0, count - 1));
      },
    });
  }

  markAllAsRead(): void {
    this.caApi.markAllNotificationsAsRead().subscribe({
      next: () => {
        const readAt = new Date().toISOString();
        this.notificationsSignal.update((current) => current.map((item) =>
          item.isRead ? item : new Notification({ ...item, readAt })));
        this.unreadCountSignal.set(0);
      },
    });
  }
}
