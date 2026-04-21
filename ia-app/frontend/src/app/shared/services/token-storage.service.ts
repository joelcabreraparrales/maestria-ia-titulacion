import { Injectable } from '@angular/core';

const TOKEN_KEY = 'auth_token';
const SESSION_CODE_KEY = 'auth_session_code';
const USER_KEY = 'auth_user';

export interface StoredUser {
  firstName: string;
  firstLastname: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class TokenStorageService {

  saveSession(token: string, sessionCode: string, user: StoredUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_CODE_KEY, sessionCode);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getSessionCode(): string | null {
    return localStorage.getItem(SESSION_CODE_KEY);
  }

  getUser(): StoredUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  }

  updateToken(token: string, sessionCode: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_CODE_KEY, sessionCode);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_CODE_KEY);
    localStorage.removeItem(USER_KEY);
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // `exp` is in seconds; Date.now() is in milliseconds
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !this.isTokenExpired();
  }
}
