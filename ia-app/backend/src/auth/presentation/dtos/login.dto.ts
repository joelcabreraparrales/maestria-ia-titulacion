export interface LoginRequestDTO {
  username: string;
  password: string;
}

export interface LoginResponseDTO {
  token: string;
  sessionCode: string;
  roles: string[];
  firstName: string;
  firstLastname: string;
}
