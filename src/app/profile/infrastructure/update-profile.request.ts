/**
 * Body of PUT /users/me/profile. Null optional values clear the field.
 */
export interface UpdateProfileRequest {
  fullName: string;
  dni: string | null;
  phoneNumber: string | null;
  location: string | null;
}
