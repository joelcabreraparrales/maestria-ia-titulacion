export interface SessionRefreshData {
  sessionId: number;
  credentialId: number;
  username: string;
  roles: string[];
  dateEnd: Date;
  accessToken: string;
}
