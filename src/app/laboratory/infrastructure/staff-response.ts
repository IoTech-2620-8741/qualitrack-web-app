import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Staff member returned by /laboratories/{laboratoryId}/staff.
 */
export interface StaffMemberResource extends BaseResource {
  id: number;

  laboratoryId: number;

  fullName: string;

  role: string;

  email: string;

  active: boolean;

  accessRole: 'OPERATOR' | 'AUDITOR' | null;

  userId: number | null;
}

export interface StaffMembersResponse extends BaseResponse {
  staffMembers: StaffMemberResource[];
}

/**
 * Credentials of the account created for a staff member.
 */
export interface StaffCredentialsResource {
  username: string;

  delivery: 'EMAIL' | 'SHOWN_ONCE';

  temporaryPassword: string | null;
}

/**
 * Body of 201 Created after registering a staff member.
 */
export interface RegisteredStaffResource {
  staffMember: StaffMemberResource;

  credentials: StaffCredentialsResource;
}
