import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, ProfileData } from '../../../services/profile.service';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';
import { ModalComponent } from '../../ui/modal/modal.component';

@Component({
  selector: 'app-user-info-card',
  imports: [CommonModule, FormsModule, InputFieldComponent, ButtonComponent, LabelComponent, ModalComponent],
  templateUrl: './user-info-card.component.html',
  styles: ``
})
export class UserInfoCardComponent implements OnInit {
  profile: ProfileData | null = null;
  isOpen = false;
  isSaving = false;

  form = {
    firstName: '',
    firstLastname: '',
    secondName: '',
    secondLastname: '',
    dateBirth: '',
  };

  constructor(private readonly profileService: ProfileService) {}

  ngOnInit(): void {
    this.profileService.profile$.subscribe(p => {
      this.profile = p;
      if (p) this.resetForm(p);
    });
  }

  openModal(): void {
    if (this.profile) this.resetForm(this.profile);
    this.isOpen = true;
  }

  closeModal(): void {
    this.isOpen = false;
  }

  handleSave(): void {
    if (this.isSaving) return;
    this.isSaving = true;
    this.profileService.updateProfile({
      firstName: this.form.firstName.trim(),
      firstLastname: this.form.firstLastname.trim(),
      secondName: this.form.secondName.trim() || null,
      secondLastname: this.form.secondLastname.trim() || null,
      dateBirth: this.form.dateBirth,
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.isOpen = false;
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  private resetForm(p: ProfileData): void {
    this.form = {
      firstName: p.firstName,
      firstLastname: p.firstLastname,
      secondName: p.secondName ?? '',
      secondLastname: p.secondLastname ?? '',
      dateBirth: p.dateBirth,
    };
  }
}
