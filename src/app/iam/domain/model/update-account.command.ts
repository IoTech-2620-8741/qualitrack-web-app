/**
 * Command to replace the username and the e-mail of the signed-in account, confirmed with the current password.
 */
export interface UpdateAccountCommand {
  username: string;
  email: string;
  currentPassword: string;
}
