import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProfileData {
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

export interface UpdateProfileRequest {
  firstName?: string;
  firstLastname?: string;
  secondName?: string | null;
  secondLastname?: string | null;
  dateBirth?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly baseUrl = `${environment.apiUrl}/profile`;
  private readonly _profile$ = new BehaviorSubject<ProfileData | null>(null);
  readonly profile$ = this._profile$.asObservable();

  constructor(private readonly http: HttpClient) {}

  loadProfile(): Observable<ProfileData> {
    return this.http.get<ProfileData>(`${this.baseUrl}/me`).pipe(
      tap(profile => this._profile$.next(profile)),
    );
  }

  updateProfile(data: UpdateProfileRequest): Observable<ProfileData> {
    return this.http.put<ProfileData>(`${this.baseUrl}/me`, data).pipe(
      tap(profile => this._profile$.next(profile)),
    );
  }

  getSnapshot(): ProfileData | null {
    return this._profile$.getValue();
  }

  getFullName(profile: ProfileData): string {
    const parts = [profile.firstName, profile.secondName, profile.firstLastname, profile.secondLastname];
    return parts.filter(Boolean).join(' ');
  }

  getInitials(profile: ProfileData): string {
    return `${profile.firstName.charAt(0)}${profile.firstLastname.charAt(0)}`.toUpperCase();
  }
}
