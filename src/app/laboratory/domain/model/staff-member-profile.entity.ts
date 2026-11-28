import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Profile of a staff member as Laboratory shows it in their detail, translated from the Profile context.
 *
 * @remarks
 * Only the quality manager reads it, and only for members with an account. A field the person has not
 * completed is null.
 */
export class StaffMemberProfile implements BaseEntity {
  /** Staff member the profile belongs to. */
  id: number;
  /** Username of the account. */
  username: string;
  /** E-mail of the account, or null without one. */
  email: string | null;
  /** Full name the person wrote in their profile. */
  fullName: string | null;
  /** National identity document. */
  dni: string | null;
  /** Phone number. */
  phoneNumber: string | null;
  /** Where the person works. */
  location: string | null;
  /** Whether the profile has a photo to download. */
  hasPhoto: boolean;
  /** When the person last saved their profile (ISO-8601), or null if they never did. */
  updatedAt: string | null;

  constructor(params: {
    id: number;
    username: string;
    email: string | null;
    fullName: string | null;
    dni: string | null;
    phoneNumber: string | null;
    location: string | null;
    hasPhoto: boolean;
    updatedAt: string | null;
  }) {
    this.id = params.id;
    this.username = params.username;
    this.email = params.email;
    this.fullName = params.fullName;
    this.dni = params.dni;
    this.phoneNumber = params.phoneNumber;
    this.location = params.location;
    this.hasPhoto = params.hasPhoto;
    this.updatedAt = params.updatedAt;
  }
}
