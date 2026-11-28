import { StaffMemberProfile } from '../domain/model/staff-member-profile.entity';
import { StaffProfileResource } from './staff-profile-response';

/** Translates the profile of a staff member of the Profile context into the one owned by Laboratory. */
export class StaffProfileAssembler {
  /**
   * @param resource - Profile resource of the staff member
   * @param staffId - Staff member the profile was read for
   * @returns The profile as Laboratory shows it
   */
  toEntityFromResource(resource: StaffProfileResource, staffId: number): StaffMemberProfile {
    return new StaffMemberProfile({
      id: staffId,
      username: resource.username,
      email: resource.email ?? null,
      fullName: resource.fullName ?? null,
      dni: resource.dni ?? null,
      phoneNumber: resource.phoneNumber ?? null,
      location: resource.location ?? null,
      hasPhoto: resource.hasPhoto,
      updatedAt: resource.updatedAt ?? null,
    });
  }
}
