import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { StaffMemberProfile } from '../domain/model/staff-member-profile.entity';
import { StaffProfileResource } from './staff-profile-response';
import { StaffProfileAssembler } from './staff-profile-assembler';

const laboratoriesEndpointUrl = environment.serverBasePath + environment.laboratoryLabsEndpointPath;

/** Reads the profile and photo of a staff member through the Profile → Laboratory anti-corruption layer. */
export class StaffProfileApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new StaffProfileAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads GET /laboratories/{laboratoryId}/staff/{staffId}/profile.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param staffId - Numeric identifier of the staff member
   * @returns Observable emitting the profile of the staff member
   */
  getStaffProfile(laboratoryId: number, staffId: number): Observable<StaffMemberProfile> {
    return this.http.get<StaffProfileResource>(this.profileUrl(laboratoryId, staffId)).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource, staffId)),
      catchError(this.handleError(`Failed to fetch the profile of staff member ${staffId}`)),
    );
  }

  /**
   * Downloads GET /laboratories/{laboratoryId}/staff/{staffId}/profile/photo.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param staffId - Numeric identifier of the staff member
   * @returns Observable emitting the image as a binary Blob
   */
  getStaffPhoto(laboratoryId: number, staffId: number): Observable<Blob> {
    const url = this.profileUrl(laboratoryId, staffId) + environment.profilePhotoEndpointPath;
    return this.http.get(url, { responseType: 'blob' }).pipe(
      catchError(this.handleError(`Failed to fetch the photo of staff member ${staffId}`)),
    );
  }

  private profileUrl(laboratoryId: number, staffId: number): string {
    return laboratoriesEndpointUrl + '/' + laboratoryId + environment.laboratoryStaffEndpointPath + '/' + staffId
      + environment.profileEndpointPath;
  }
}
