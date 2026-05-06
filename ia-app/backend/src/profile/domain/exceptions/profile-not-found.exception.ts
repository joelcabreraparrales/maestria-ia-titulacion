export class ProfileNotFoundException extends Error {
  constructor() {
    super("Perfil no encontrado");
    this.name = "ProfileNotFoundException";
  }
}
