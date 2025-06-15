import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { UserService, User } from '../services/user-service.service';
import { Subscription } from 'rxjs';

// Angular Material imports:
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIf } from '@angular/common';


@Component({
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss'],
  // Add these only if the component is standalone:
   standalone: true,
   imports: [MatButtonModule, MatProgressBarModule, MatTableModule, MatIconModule, MatTooltipModule,NgIf],
})
export class UsersManagementComponent implements OnInit, OnDestroy {

  users: User[] = [];
  isLoading = false;
  errorMessage = '';

  private subscription: Subscription = new Subscription();

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.subscription.add(
      this.userService.getAllUsers().subscribe({
        next: users => {
          this.users = users;
          this.isLoading = false;
        },
        error: err => {
          this.errorMessage = 'Erreur lors du chargement des utilisateurs. ' + err.message;
          this.isLoading = false;
        }
      })
    );
  }

  deleteUser(user: User): void {
    if (confirm(`Supprimer l'utilisateur ${user.username} ?`)) {
      this.subscription.add(
        this.userService.deleteUser(user.id!).subscribe({
          next: () => {
            this.loadUsers();
          },
          error: err => alert('Erreur lors de la suppression: ' + err.message)
        })
      );
    }
  }

  resetPassword(user: User): void {
    if (confirm(`Réinitialiser le mot de passe pour ${user.username} ?`)) {
      this.subscription.add(
        this.userService.resetPassword(user.id!).subscribe({
          next: () => alert('Mot de passe réinitialisé avec succès.'),
          error: err => alert('Erreur lors de la réinitialisation: ' + err.message)
        })
      );
    }
  }

  editUser(user: User): void {
    this.router.navigate(['/admin/users/edit', user.id]);
  }

  addUser(): void {
    this.router.navigate(['/admin/users/new']);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
