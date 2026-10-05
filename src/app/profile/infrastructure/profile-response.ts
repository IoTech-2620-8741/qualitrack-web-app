/** Profile as the platform sends it (GET /users/me/profile, GET .../staff/{staffId}/profile). */
export interface ProfileResource {
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
}
