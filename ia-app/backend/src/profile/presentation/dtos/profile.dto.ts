export interface GetProfileResponseDTO {
  profileCode: string;
  firstName: string;
  firstLastname: string;
  secondName: string | null;
  secondLastname: string | null;
  email: string;
  dni: string;
  dateBirth: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequestDTO {
  firstName?: string;
  firstLastname?: string;
  secondName?: string | null;
  secondLastname?: string | null;
  dateBirth?: string;
}
