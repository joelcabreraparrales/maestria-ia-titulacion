import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signin-form',
  imports: [
    CommonModule,
    RouterModule,
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
  ],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {
  showPassword = false;
  isChecked = false;
  isLoading = false;
  errorMessage = '';

  username = '';
  password = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSignIn(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Usuario y contraseña son requeridos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.username.trim(), this.password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.errorMessage = 'Credenciales inválidas. Verifique su usuario y contraseña.';
        } else if (err.status === 429) {
          this.errorMessage = 'Demasiados intentos. Intente nuevamente en 15 minutos.';
        } else {
          this.errorMessage = 'Error al iniciar sesión. Intente más tarde.';
        }
      },
    });
  }
}
