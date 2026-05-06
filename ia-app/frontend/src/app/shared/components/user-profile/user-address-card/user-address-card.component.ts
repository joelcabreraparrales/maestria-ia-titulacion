import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService, ProfileData } from '../../../services/profile.service';

@Component({
  selector: 'app-user-address-card',
  imports: [CommonModule],
  templateUrl: './user-address-card.component.html',
  styles: ``
})
export class UserAddressCardComponent implements OnInit {
  profile: ProfileData | null = null;

  constructor(private readonly profileService: ProfileService) {}

  ngOnInit(): void {
    this.profileService.profile$.subscribe(p => (this.profile = p));
  }

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('es-EC', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }
}
