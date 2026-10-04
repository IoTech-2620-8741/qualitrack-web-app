/** Answer to a recovery request; the same whether or not the account exists (TS05). */
export interface PasswordRecoveryAcceptedResource {
  codeValidityMinutes: number;
}

/** Answer to a successful password reset (TS06). */
export interface PasswordResetCompletedResource {
  username: string;
}
