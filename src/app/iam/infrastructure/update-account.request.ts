/**
 * Body of PUT /users/me: the username and e-mail of the account, confirmed with the current password.
 */
export interface UpdateAccountRequest {
  username: string;

  email: string;

  currentPassword: string;
}
