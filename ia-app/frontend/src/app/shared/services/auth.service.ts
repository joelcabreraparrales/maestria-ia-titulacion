import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { TokenStorageService, StoredUser } from './token-storage.service';
import { environment } from '../../../environments/environment';

interface LoginResponse {
  token: string;
  sessionCode: string;
  roles: string[];
  firstName: string;
  firstLastname: string;
}

interface RefreshResponse {
  token: string;
  sessionCode: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly _currentUser$: BehaviorSubject<StoredUser | null>;
  readonly currentUser$;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenStorage: TokenStorageService,
    private readonly router: Router,
  ) {
    this._currentUser$ = new BehaviorSubject<StoredUser | null>(this.tokenStorage.getUser());
    this.currentUser$ = this._currentUser$.asObservable();
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { username, password }).pipe(
      tap((res) => {
        const user: StoredUser = {
          firstName: res.firstName,
          firstLastname: res.firstLastname,
          roles: res.roles,
        };
        this.tokenStorage.saveSession(res.token, res.sessionCode, user);
        this._currentUser$.next(user);
      }),
    );
  }

  logout(): Observable<unknown> {
    const sessionCode = this.tokenStorage.getSessionCode();
    return this.http.post(`${this.baseUrl}/logout`, { sessionCode }).pipe(
      tap(() => {
        this.tokenStorage.clear();
        this._currentUser$.next(null);
        this.router.navigate(['/signin']);
      }),
    );
  }

  refresh(): Observable<RefreshResponse> {
    const sessionCode = this.tokenStorage.getSessionCode();
    return this.http.post<RefreshResponse>(`${this.baseUrl}/refresh`, { sessionCode }).pipe(
      tap((res) => {
        this.tokenStorage.updateToken(res.token, res.sessionCode);
      }),
    );
  }

  isAuthenticated(): boolean {
    return this.tokenStorage.isAuthenticated();
  }
}
