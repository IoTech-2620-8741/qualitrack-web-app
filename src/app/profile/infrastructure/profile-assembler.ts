import { Profile } from '../domain/model/profile.entity';
import { ProfileResource } from './profile-response';

/**
 * Converts the profiles sent by the platform into domain entities.
 */
export class ProfileAssembler {
  toEntityFromResource(resource: ProfileResource): Profile {
    return new Profile({ ...resource });
  }
}
