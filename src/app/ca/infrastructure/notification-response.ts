import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { AlertSeverity } from '../domain/model/deviation-alert.entity';
import { NotificationSubject, NotificationType } from '../domain/model/notification.entity';

/** Notification as the platform sends it (GET /users/me/notifications). */
export interface NotificationResource extends BaseResource {
  id: number;
  type: NotificationType;
  severity: AlertSeverity | null;
  subjectType: NotificationSubject;
  subjectId: number;
  environmentName: string | null;
  subjectName: string | null;
  parameterName: string | null;
  recordedValue: number | null;
  unit: string | null;
  actorName: string | null;
  note: string | null;
  occurredAt: string;
  readAt: string | null;
}

/** Envelope kept for the base assembler; the platform answers with an array. */
export interface NotificationsResponse extends BaseResponse {
  notifications: NotificationResource[];
}

/** Answer of GET /users/me/notifications/unread-count. */
export interface UnreadNotificationsResource {
  unreadCount: number;
}

/** Answer of POST /users/me/notifications/read-receipts. */
export interface NotificationsReadResource {
  markedAsRead: number;
}

/** Answer of POST /deviation-alerts/{alertId}/email-notifications (TS78). */
export interface AlertEmailNotificationResource {
  alertId: number;
  recipients: number;
  delivered: number;
  sentAt: string;
}
