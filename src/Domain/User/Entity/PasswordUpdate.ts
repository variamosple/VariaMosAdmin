export class PasswordUpdate {
  constructor(
    public currentPassword: string,
    public newPassword: string,
    public passwordConfirmation: string
  ) {}
}
