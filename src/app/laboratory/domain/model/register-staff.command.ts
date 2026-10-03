import { StaffAccessRole, StaffMember } from './staff-member.entity';

/**
 * Command for registering a new staff member, who receives an account to sign in.
 *
 * @remarks
 * In CQRS, this command represents the quality manager's intent to create a staff member
 * under their laboratory. The e-mail becomes the username of the account.
 */
export interface RegisterStaffCommand {
  /**
   * The full legal name of the staff member.
   */
  fullName: string;

  /**
   * The job title of the staff member in the laboratory.
   */
  role: string;

  /**
   * The corporate email address; the credentials are sent to it.
   */
  email: string;

  /**
   * What the staff member can do with their account.
   */
  accessRole: StaffAccessRole;
}

/**
 * How the staff member receives the credentials of their account: by e-mail, or shown once to
 * the quality manager when they could not be e-mailed.
 */
export interface StaffCredentials {
  username: string;
  delivery: 'EMAIL' | 'SHOWN_ONCE';
  temporaryPassword: string | null;
}

/**
 * Staff member registered with the delivery of their credentials.
 */
export interface RegisteredStaff {
  staffMember: StaffMember;
  credentials: StaffCredentials;
}
