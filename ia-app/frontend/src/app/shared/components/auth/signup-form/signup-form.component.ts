import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signup-form',
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './signup-form.component.html',
  styles: ``
})
export class SignupFormComponent {
  showPassword = false;
  isChecked = false;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  firstName = '';
  firstLastname = '';
  email = '';
  dni = '';
  dateBirth = '';
  username = '';
  password = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (!this.firstName || !this.firstLastname || !this.email || !this.dni || !this.dateBirth || !this.username || !this.password) {
      this.errorMessage.set('Por favor completa todos los campos requeridos.');
      return;
    }

    if (!this.isChecked) {
      this.errorMessage.set('Debes aceptar los términos y condiciones.');
      return;
    }

    this.isLoading.set(true);

    this.authService.register({
      firstName: this.firstName,
      firstLastname: this.firstLastname,
      email: this.email,
      dni: this.dni,
      dateBirth: this.dateBirth,
      username: this.username,
      password: this.password,
    }).subscribe({
      next: () => {
        this.successMessage.set('Cuenta creada correctamente. Ahora puedes iniciar sesión.');
        setTimeout(() => this.router.navigate(['/signin']), 2000);
      },
      error: (err) => {
        const msg = err?.error?.error;
        if (err.status === 409) {
          this.errorMessage.set(msg ?? 'El usuario o correo ya está registrado.');
        } else if (err.status === 400 && err.error?.details) {
          const first = err.error.details[0];
          this.errorMessage.set(first?.message ?? 'Datos inválidos.');
        } else {
          this.errorMessage.set(msg ?? 'Error al registrar. Intenta nuevamente.');
        }
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false),
    });
  }
}
