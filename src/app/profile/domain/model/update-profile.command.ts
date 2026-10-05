/**
 * Command to replace the personal data of the profile of the signed-in user. Empty optional values clear the field.
 */
export interface UpdateProfileCommand {
  fullName: string;
  dni: string;
  phoneNumber: string;
  location: string;
}
