export class ProfileEntity {
  constructor(
    private readonly id: number,
    private readonly code: string,
    private readonly firstName: string,
    private readonly firstLastname: string,
    private readonly secondName: string | null,
    private readonly secondLastname: string | null,
    private readonly email: string,
    private readonly dni: string,
    private readonly dateBirth: Date,
    private readonly active: boolean,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  getId(): number { return this.id; }
  getCode(): string { return this.code; }
  getFirstName(): string { return this.firstName; }
  getFirstLastname(): string { return this.firstLastname; }
  getSecondName(): string | null { return this.secondName; }
  getSecondLastname(): string | null { return this.secondLastname; }
  getEmail(): string { return this.email; }
  getDni(): string { return this.dni; }
  getDateBirth(): Date { return this.dateBirth; }
  isActive(): boolean { return this.active; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
}
