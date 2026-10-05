import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { Notification } from '../domain/model/notification.entity';
import {
  NotificationResource,
  NotificationsReadResource,
  NotificationsResponse,
  UnreadNotificationsResource,
} from './notification-response';
import { NotificationAssembler } from './notification-assembler';

const notificationsEndpointUrl =
  `${environment.serverBasePath}${environment.usersEndpointPath}${environment.caNotificationsEndpointPath}`;

/**
 * HTTP endpoint client for the notifications of the signed-in user (/users/me/notifications).
 */
export class NotificationApiEndpoint extends BaseApiEndpoint<
  Notification,
  NotificationResource,
  NotificationsResponse,
  NotificationAssembler
> {
  constructor(http: HttpClient) {
    super(http, notificationsEndpointUrl, new NotificationAssembler());
  }

  /**
   * @param unreadOnly - Leaves out the notifications already read
   * @param limit - Maximum number of notifications, newest first (1 to 100)
   */
  getNotifications(unreadOnly: boolean, limit: number): Observable<Notification[]> {
    const params = new HttpParams().set('unread', unreadOnly).set('limit', limit);
    return this.http.get<NotificationResource[]>(this.endpointUrl, { params }).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to fetch notifications')),
    );
  }

  getUnreadCount(): Observable<number> {
    return this.http
      .get<UnreadNotificationsResource>(`${this.endpointUrl}${environment.caNotificationUnreadCountEndpointPath}`)
      .pipe(
        map((resource) => resource.unreadCount),
        catchError(this.handleError('Failed to count unread notifications')),
      );
  }

  markAsRead(notificationId: number): Observable<Notification> {
    return this.http
      .post<NotificationResource>(
        `${this.endpointUrl}/${notificationId}${environment.caNotificationReadReceiptsEndpointPath}`,
        null,
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to mark notification ${notificationId} as read`)),
      );
  }

  /** @returns How many notifications were unread */
  markAllAsRead(): Observable<number> {
    return this.http
      .post<NotificationsReadResource>(`${this.endpointUrl}${environment.caNotificationReadReceiptsEndpointPath}`, null)
      .pipe(
        map((resource) => resource.markedAsRead),
        catchError(this.handleError('Failed to mark the notifications as read')),
      );
  }
}
