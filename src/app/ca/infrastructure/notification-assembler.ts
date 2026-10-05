import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Notification } from '../domain/model/notification.entity';
import { NotificationResource, NotificationsResponse } from './notification-response';

/**
 * Converts the notifications sent by the platform into domain entities.
 */
export class NotificationAssembler
  implements BaseAssembler<Notification, NotificationResource, NotificationsResponse>
{
  toEntitiesFromResponse(response: NotificationsResponse): Notification[] {
    return response.notifications.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: NotificationResource): Notification {
    return new Notification({ ...resource });
  }

  toResourceFromEntity(entity: Notification): NotificationResource {
    return {
      id: entity.id,
      type: entity.type,
      severity: entity.severity,
      subjectType: entity.subjectType,
      subjectId: entity.subjectId,
      environmentName: entity.environmentName,
      subjectName: entity.subjectName,
      parameterName: entity.parameterName,
      recordedValue: entity.recordedValue,
      unit: entity.unit,
      actorName: entity.actorName,
      note: entity.note,
      occurredAt: entity.occurredAt,
      readAt: entity.readAt,
    };
  }
}
