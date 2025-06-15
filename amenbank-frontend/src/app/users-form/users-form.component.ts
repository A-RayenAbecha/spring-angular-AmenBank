import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, User, Role } from '../services/user-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { NgIf, NgFor } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-form',
  templateUrl: './users-form.component.html',
  styleUrls: ['./users-form.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    NgIf,
    NgFor
  ],
})
export class UsersFormComponent implements OnInit {

  userForm!: FormGroup;
  roles: { value: Role, label: string }[] = [];
  isEditMode = false;
  userId?: number;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
maxDate: string = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    // Initialize roles with display names matching backend enum values
    this.roles = [
      { value: Role.CLIENT, label: 'Client' },
      { value: Role.ADMIN, label: 'Super Administrateur' },
      { value: Role.EMPLOYEE, label: 'Responsable' }
    ];
    
    console.log('Available roles:', this.roles); // Debug log

    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.userId;

    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20)]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
      dateOfBirth: [''],
      cin: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      role: ['', Validators.required],
      enabled: [true],
      accountNonLocked: [true],
      twoFactorEnabled: [false]
    });

    if (this.isEditMode) {
      this.loadUser();
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  loadUser(): void {
    this.userService.getAllUsers().subscribe({
      next: users => {
        const user = users.find(u => u.id === this.userId);
        if (user) {
          console.log('Loading user:', user); // Debug log
          console.log('User role:', user.role); // Debug log
          console.log('User dateOfBirth:', user.dateOfBirth); // Debug log
          
          // Handle date formatting properly
          let formattedDate = '';
          if (user.dateOfBirth) {
            // Handle both ISO string and LocalDate formats
            if (typeof user.dateOfBirth === 'string') {
              if (user.dateOfBirth.includes('T')) {
                // ISO DateTime format
                formattedDate = user.dateOfBirth.split('T')[0];
              } else {
                // Already in YYYY-MM-DD format
                formattedDate = user.dateOfBirth;
              }
            }
          }
          
          this.userForm.patchValue({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            dateOfBirth: formattedDate,
            cin: user.cin,
            email: user.email,
            role: user.role, // This should now match the enum values
            enabled: user.enabled,
            accountNonLocked: user.accountNonLocked,
            twoFactorEnabled: user.twoFactorEnabled
          });
          
          // Debug: Check if values are set correctly
          console.log('Form dateOfBirth value after patch:', this.userForm.get('dateOfBirth')?.value);
          console.log('Form role value after patch:', this.userForm.get('role')?.value);
        } else {
          this.errorMessage = 'Utilisateur non trouvé';
        }
      },
      error: err => {
        console.error('Error loading user:', err);
        this.errorMessage = 'Erreur lors du chargement de l\'utilisateur';
      }
    });
  }

onSubmit(): void {
  if (this.userForm.invalid) {
    console.log('Form is invalid:', this.userForm.errors);
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      if (control?.invalid) {
        console.log(`${key} is invalid:`, control.errors);
      }
    });
    return;
  }

  const formValue = { ...this.userForm.value } as User;
  
  // Handle empty string values - only delete if truly empty, not if it's a valid empty date
  if (!formValue.cin || formValue.cin.trim() === '') {
    formValue.cin = undefined; // Use undefined instead of delete
  }
  
  if (!formValue.firstName || formValue.firstName.trim() === '') {
    formValue.firstName = undefined;
  }
  
  if (!formValue.lastName || formValue.lastName.trim() === '') {
    formValue.lastName = undefined;
  }
  
  // Handle date - DO NOT delete the field, send null/undefined if empty
  if (formValue.dateOfBirth && formValue.dateOfBirth.trim() !== '') {
    const dateValue = formValue.dateOfBirth.trim();
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      formValue.dateOfBirth = dateValue;
    } else {
      console.warn('Invalid date format:', dateValue);
      formValue.dateOfBirth = undefined; // Don't delete, set to undefined
    }
  } else {
    // Instead of deleting, explicitly set to undefined to clear the field
    formValue.dateOfBirth = undefined;
  }
  
  // Remove password field for updates if it's empty
  if (this.isEditMode && (!formValue.password || formValue.password.trim() === '')) {
    delete formValue.password; // This one can be deleted since it's optional for updates
  }
  
  console.log('Submitting user:', formValue);
  console.log('Date being sent:', formValue.dateOfBirth);
  console.log('Role being sent:', formValue.role);

  if (this.isEditMode) {
    this.userService.updateUser(this.userId!, formValue).subscribe({
      next: () => this.router.navigate(['/admin/users']),
      error: err => {
        console.error('Error updating user:', err);
        this.errorMessage = err.message || 'Erreur lors de la mise à jour';
      }
    });
  } else {
    this.userService.createUser(formValue).subscribe({
      next: () => this.router.navigate(['/admin/users']),
      error: err => {
        console.error('Error creating user:', err);
        this.errorMessage = err.message || 'Erreur lors de la création';
      }
    });
  }
}

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }
}