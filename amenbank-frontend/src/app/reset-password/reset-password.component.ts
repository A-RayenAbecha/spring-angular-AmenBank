import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  styleUrls: ['./reset-password.component.scss'],
  templateUrl: './reset-password.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule
  ]
})
export class ResetPasswordComponent {
  form: FormGroup;
  token: string | null = null;

  // Add these two properties to avoid the error
  message: string | null = null;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  onSubmit() {
    this.message = null;
    this.error = null;

    if (this.form.valid && this.token) {
      this.authService.resetPassword(this.token, this.form.value.newPassword).subscribe({
        next: (response) => {
          this.message = 'Mot de passe réinitialisé avec succès';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          this.error = 'Token invalide ou expiré';
        }
      });
    }
  }
}
