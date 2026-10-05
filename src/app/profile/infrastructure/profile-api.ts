import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Profile } from '../domain/model/profile.entity';
import { ProfileApiEndpoint } from './profile-api-endpoint';
import { UpdateProfileRequest } from './update-profile.request';

/**
 * HTTP API facade of the Profile bounded context.
 */
@Injectable({ providedIn: 'root' })
export class ProfileApi extends BaseApi {
  private readonly profileEndpoint: ProfileApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.profileEndpoint = new ProfileApiEndpoint(http);
  }

  getMyProfile(): Observable<Profile> {
    return this.profileEndpoint.getMine();
  }

  updateMyProfile(request: UpdateProfileRequest): Observable<Profile> {
    return this.profileEndpoint.updateMine(request);
  }

  getMyPhoto(): Observable<Blob> {
    return this.profileEndpoint.getMyPhoto();
  }

  replaceMyPhoto(image: File): Observable<Profile> {
    return this.profileEndpoint.replaceMyPhoto(image);
  }

  removeMyPhoto(): Observable<void> {
    return this.profileEndpoint.removeMyPhoto();
  }

  /** Profile of a staff member; only the quality manager of the laboratory can read it. */
  getStaffProfile(laboratoryId: number, staffId: number): Observable<Profile> {
    return this.profileEndpoint.getStaffProfile(laboratoryId, staffId);
  }

  getStaffPhoto(laboratoryId: number, staffId: number): Observable<Blob> {
    return this.profileEndpoint.getStaffPhoto(laboratoryId, staffId);
  }
}
