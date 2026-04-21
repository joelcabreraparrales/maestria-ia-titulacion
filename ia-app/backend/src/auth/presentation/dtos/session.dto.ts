export interface SessionCodeRequestDTO {
  sessionCode: string;
}

export interface RefreshResponseDTO {
  token: string;
  sessionCode: string;
}
