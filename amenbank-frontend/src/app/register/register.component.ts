import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      first_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      last_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      dateOfBirth: ['', Validators.required],
      cin: ['', [Validators.pattern(/^\d{8}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['CLIENT', Validators.required]
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);  // fixed to lowercase 'login' for consistency
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    const rawData = this.registerForm.value;

    // Prepare payload with fallback to empty strings
    const payload = {
      username: rawData.username ?? '',
      first_name: rawData.first_name ?? '',
      last_name: rawData.last_name ?? '',
      dateOfBirth: rawData.dateOfBirth ?? '',
      cin: rawData.cin ?? '',
      email: rawData.email ?? '',
      password: rawData.password ?? '',
      role: rawData.role ?? ''
    };

    console.log('🔄 Sending registration payload:', payload);

    this.authService.register(payload).subscribe({
      next: (res: string) => {
        // Now res is the plain text string returned by your backend
        console.log('✅ Registration successful:', res);
        this.snackBar.open(res || 'User registered successfully', 'Close', { duration: 5000 });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('❌ Registration error:', err);
        let errorMessage = 'Registration failed';

        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (typeof err.error === 'object') {
            // Prefer error.message, fallback to JSON string
            errorMessage = err.error.message || JSON.stringify(err.error);
          }
        }

        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      }
    });
  }
}
