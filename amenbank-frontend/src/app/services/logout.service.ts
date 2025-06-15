import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-logout-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="logout-dialog">
      <h2 mat-dialog-title>Confirmation de déconnexion</h2>
      <mat-dialog-content>
        Êtes-vous sûr de vouloir vous déconnecter ?
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Annuler</button>
        <button mat-raised-button color="warn" [mat-dialog-close]="true">
          Se déconnecter
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .logout-dialog {
      padding: 20px;
      min-width: 300px;
    }
    mat-dialog-actions {
      margin-top: 20px;
      gap: 10px;
    }
  `]
})
export class LogoutDialogComponent {}

@Injectable({
  providedIn: 'root'
})
export class LogoutService {
  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  initiateLogout() {
    const dialogRef = this.dialog.open(LogoutDialogComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.logout();
        
        this.snackBar.open('Vous avez été déconnecté avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        this.router.navigate(['/login']);
      }
    });
  }
} 