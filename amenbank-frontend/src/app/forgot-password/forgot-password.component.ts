import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule,    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule],
  templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss']

  
})
export class ForgotPasswordComponent {
  form: FormGroup;
  message = '';
  error = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const email = this.form.value.email;
      this.authService.forgotPassword(email).subscribe({
        next: (res) => {
          this.message = 'Email envoyé. Veuillez vérifier votre boîte mail.';
            console.log('Réponse réussie du backend:', res);
          this.error = '';
          // Optionnel : Redirection immédiate vers la page de saisie de token
          // avec paramètre email ou laisser le lien dans l'e-mail
          // this.router.navigate(['/reset-password'], { queryParams: { token: '...' } });
        },
        error: (err) => {
          this.message = '';
          this.error = err.error?.message || 'Erreur lors de l\'envoi de l\'email';
        },
      });
    }
  }
}
