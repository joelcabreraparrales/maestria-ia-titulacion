import { Component, OnInit } from '@angular/core';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { UserMetaCardComponent } from '../../shared/components/user-profile/user-meta-card/user-meta-card.component';
import { UserInfoCardComponent } from '../../shared/components/user-profile/user-info-card/user-info-card.component';
import { UserAddressCardComponent } from '../../shared/components/user-profile/user-address-card/user-address-card.component';
import { ProfileService } from '../../shared/services/profile.service';

@Component({
  selector: 'app-profile',
  imports: [
    PageBreadcrumbComponent,
    UserMetaCardComponent,
    UserInfoCardComponent,
    UserAddressCardComponent,
  ],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent implements OnInit {
  constructor(private readonly profileService: ProfileService) {}

  ngOnInit(): void {
    if (!this.profileService.getSnapshot()) {
      this.profileService.loadProfile().subscribe();
    }
  }
}
