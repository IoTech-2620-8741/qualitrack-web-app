import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { Profile } from '../domain/model/profile.entity';
import { ProfileAssembler } from './profile-assembler';
import { ProfileResource } from './profile-response';
import { UpdateProfileRequest } from './update-profile.request';

const myProfileUrl =
  `${environment.serverBasePath}${environment.usersEndpointPath}${environment.profileCurrentUserEndpointPath}`;

/**
 * HTTP endpoint client of the profiles: the one of the signed-in user (/users/me/profile) and, for the quality
 * manager, the one of a staff member (/laboratories/{laboratoryId}/staff/{staffId}/profile).
 */
export class ProfileApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new ProfileAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  getMine(): Observable<Profile> {
    return this.http.get<ProfileResource>(myProfileUrl).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to fetch the profile')),
    );
  }

  updateMine(request: UpdateProfileRequest): Observable<Profile> {
    return this.http.put<ProfileResource>(myProfileUrl, request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to update the profile')),
    );
  }

  getMyPhoto(): Observable<Blob> {
    return this.http.get(`${myProfileUrl}${environment.profilePhotoEndpointPath}`, { responseType: 'blob' }).pipe(
      catchError(this.handleError('Failed to fetch the profile photo')),
    );
  }

  /** Sends the image itself as the body (JPEG, PNG or WebP up to 2 MB). */
  replaceMyPhoto(image: File): Observable<Profile> {
    return this.http.put<ProfileResource>(`${myProfileUrl}${environment.profilePhotoEndpointPath}`, image, {
      headers: { 'Content-Type': image.type },
    }).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to replace the profile photo')),
    );
  }

  removeMyPhoto(): Observable<void> {
    return this.http.delete<void>(`${myProfileUrl}${environment.profilePhotoEndpointPath}`).pipe(
      catchError(this.handleError('Failed to remove the profile photo')),
    );
  }

  getStaffProfile(laboratoryId: number, staffId: number): Observable<Profile> {
    return this.http.get<ProfileResource>(this.staffProfileUrl(laboratoryId, staffId)).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to fetch the profile of staff member ${staffId}`)),
    );
  }

  getStaffPhoto(laboratoryId: number, staffId: number): Observable<Blob> {
    return this.http.get(`${this.staffProfileUrl(laboratoryId, staffId)}${environment.profilePhotoEndpointPath}`,
      { responseType: 'blob' }).pipe(
      catchError(this.handleError(`Failed to fetch the photo of staff member ${staffId}`)),
    );
  }

  private staffProfileUrl(laboratoryId: number, staffId: number): string {
    return `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}/${laboratoryId}`
      + `${environment.laboratoryStaffEndpointPath}/${staffId}${environment.profileEndpointPath}`;
  }
}
