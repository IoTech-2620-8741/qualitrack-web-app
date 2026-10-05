import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { AlertSeverity } from './deviation-alert.entity';

/** What a notification tells: a step of an alert or a quality decision on a batch. */
export type NotificationType =
  | 'ALERT_OPENED'
  | 'ALERT_ESCALATED'
  | 'ALERT_ACKNOWLEDGED'
  | 'ALERT_RESOLVED'
  | 'BATCH_RELEASED'
  | 'BATCH_REJECTED';

/** Record a notification is about. */
export type NotificationSubject = 'ALERT' | 'BATCH';

/**
 * Notice of something that happened to an alert or a batch of the laboratory that the person did not do (US83).
 *
 * @remarks
 * The platform sends the values; the text is composed in the language of the person.
 */
export class Notification implements BaseEntity {
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

  constructor(params: {
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
  }) {
    this.id = params.id;
    this.type = params.type;
    this.severity = params.severity;
    this.subjectType = params.subjectType;
    this.subjectId = params.subjectId;
    this.environmentName = params.environmentName;
    this.subjectName = params.subjectName;
    this.parameterName = params.parameterName;
    this.recordedValue = params.recordedValue;
    this.unit = params.unit;
    this.actorName = params.actorName;
    this.note = params.note;
    this.occurredAt = params.occurredAt;
    this.readAt = params.readAt;
  }

  get isRead(): boolean {
    return this.readAt !== null;
  }

  /** Route of the alert or the batch the notification is about. */
  get link(): string[] {
    return this.subjectType === 'ALERT'
      ? ['/alerts/deviation-detail', String(this.subjectId)]
      : ['/batches/batch-detail', String(this.subjectId)];
  }

  /** Material icon of the notification. */
  get icon(): string {
    switch (this.type) {
      case 'ALERT_OPENED':
      case 'ALERT_ESCALATED':
        return this.severity === 'CRITICAL' ? 'error' : 'warning';
      case 'ALERT_ACKNOWLEDGED':
        return 'visibility';
      case 'ALERT_RESOLVED':
        return 'task_alt';
      case 'BATCH_RELEASED':
        return 'verified';
      case 'BATCH_REJECTED':
        return 'block';
    }
  }
}
