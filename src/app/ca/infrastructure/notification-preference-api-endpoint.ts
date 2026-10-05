import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { NotificationPreference } from '../domain/model/notification-preference.entity';
import {
  NotificationPreferenceResource,
  NotificationPreferencesResponse,
} from './notification-preference-response';
import { NotificationPreferenceAssembler } from './notification-preference-assembler';
import { UpdateNotificationPreferenceRequest } from './notification-preference.request';

const preferencesEndpointUrl =
  `${environment.serverBasePath}${environment.usersEndpointPath}${environment.caNotificationPrefsEndpointPath}`;

/**
 * HTTP endpoint client for the notification preferences of the signed-in user (/users/me/notification-preferences).
 */
export class NotificationPreferenceApiEndpoint extends BaseApiEndpoint<
  NotificationPreference,
  NotificationPreferenceResource,
  NotificationPreferencesResponse,
  NotificationPreferenceAssembler
> {
  constructor(http: HttpClient) {
    super(http, preferencesEndpointUrl, new NotificationPreferenceAssembler());
  }

  getPreferences(): Observable<NotificationPreference> {
    return this.http.get<NotificationPreferenceResource>(this.endpointUrl).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to fetch the notification preferences')),
    );
  }

  updatePreferences(request: UpdateNotificationPreferenceRequest): Observable<NotificationPreference> {
    return this.http.put<NotificationPreferenceResource>(this.endpointUrl, request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to update the notification preferences')),
    );
  }
}
