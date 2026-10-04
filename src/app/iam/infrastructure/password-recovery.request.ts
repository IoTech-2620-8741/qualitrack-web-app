/** Body of POST /authentication/password-recovery-requests (TS05). */
export interface PasswordRecoveryRequest {
  account: string;
}

/** Body of POST /authentication/password-resets (TS06). */
export interface PasswordResetRequest {
  account: string;
  code: string;
  newPassword: string;
}
