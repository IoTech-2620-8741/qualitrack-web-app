import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PasswordRecoveryRequest, PasswordResetRequest } from './password-recovery.request';
import { PasswordRecoveryAcceptedResource, PasswordResetCompletedResource } from './password-recovery-response';

/**
 * Public endpoints of the password recovery: the code is sent to the e-mail of the account and then used to set a new
 * password (TS05, TS06).
 */
export class PasswordRecoveryApiEndpoint {
  constructor(private readonly http: HttpClient) {}

  requestRecovery(request: PasswordRecoveryRequest): Observable<PasswordRecoveryAcceptedResource> {
    return this.http.post<PasswordRecoveryAcceptedResource>(
      `${environment.serverBasePath}${environment.iamPasswordRecoveryRequestsEndpointPath}`, request);
  }

  resetPassword(request: PasswordResetRequest): Observable<PasswordResetCompletedResource> {
    return this.http.post<PasswordResetCompletedResource>(
      `${environment.serverBasePath}${environment.iamPasswordResetsEndpointPath}`, request);
  }
}
