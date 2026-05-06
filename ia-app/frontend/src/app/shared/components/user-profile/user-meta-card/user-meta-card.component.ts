import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService, ProfileData } from '../../../services/profile.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-meta-card',
  imports: [CommonModule],
  templateUrl: './user-meta-card.component.html',
  styles: ``
})
export class UserMetaCardComponent implements OnInit {
  profile: ProfileData | null = null;
  role: string = '';

  constructor(
    private readonly profileService: ProfileService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.profileService.profile$.subscribe(p => (this.profile = p));
    this.authService.currentUser$.subscribe(u => {
      this.role = u?.roles?.[0] ?? '';
    });
  }

  getInitials(): string {
    return this.profile ? this.profileService.getInitials(this.profile) : '?';
  }

  getFullName(): string {
    return this.profile ? this.profileService.getFullName(this.profile) : '';
  }
}
