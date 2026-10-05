import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Personal data a person keeps in QualiTrack, with the account it belongs to.
 *
 * @remarks
 * The profile belongs to the Profile bounded context; the username and e-mail come from the account (IAM) and the
 * position from the staff record of the laboratory, so the profile is identified by the account.
 */
export class Profile implements BaseEntity {
  id: number;
  userId: number;
  staffId: number | null;
  username: string;
  email: string | null;
  roles: string[];
  fullName: string | null;
  dni: string | null;
  phoneNumber: string | null;
  location: string | null;
  position: string | null;
  hasPhoto: boolean;
  photoUpdatedAt: string | null;
  updatedAt: string | null;

  constructor(params: {
    userId: number;
    staffId: number | null;
    username: string;
    email: string | null;
    roles: string[];
    fullName: string | null;
    dni: string | null;
    phoneNumber: string | null;
    location: string | null;
    position: string | null;
    hasPhoto: boolean;
    photoUpdatedAt: string | null;
    updatedAt: string | null;
  }) {
    this.id = params.userId;
    this.userId = params.userId;
    this.staffId = params.staffId;
    this.username = params.username;
    this.email = params.email;
    this.roles = params.roles;
    this.fullName = params.fullName;
    this.dni = params.dni;
    this.phoneNumber = params.phoneNumber;
    this.location = params.location;
    this.position = params.position;
    this.hasPhoto = params.hasPhoto;
    this.photoUpdatedAt = params.photoUpdatedAt;
    this.updatedAt = params.updatedAt;
  }

  /** Name shown to others: the full name, or the username until the profile is completed. */
  get displayName(): string {
    return this.fullName ?? this.username;
  }

  /** Initials shown when there is no photo. */
  get initials(): string {
    return this.displayName
      .trim()
      .split(/[\s._@-]+/)
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';
  }

  /** Whether the person has not saved a full name yet. */
  get isIncomplete(): boolean {
    return this.fullName === null;
  }
}
