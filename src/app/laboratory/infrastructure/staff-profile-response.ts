/** Fields of the Profile resource of a staff member that Laboratory shows in their detail. */
export interface StaffProfileResource {
  username: string;
  email: string | null;
  fullName: string | null;
  dni: string | null;
  phoneNumber: string | null;
  location: string | null;
  hasPhoto: boolean;
  updatedAt: string | null;
}
