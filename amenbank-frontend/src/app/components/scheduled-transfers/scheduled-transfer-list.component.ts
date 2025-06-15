import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScheduledTransferService } from '../../services/scheduled-transfer.service';
import { ScheduledTransfer, Frequency } from '../../models/scheduled-transfer';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ScheduledTransferFormComponent } from './scheduled-transfer-form.component';

@Component({
  selector: 'app-scheduled-transfer-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    ScheduledTransferFormComponent
  ],
  template: `
    <div class="container mx-auto p-4">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-semibold text-gray-800">Virements Permanents</h2>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nouveau Virement Permanent
        </button>
      </div>

      <div class="grid gap-4">
        <mat-card *ngFor="let transfer of transfers" class="p-4">
          <mat-card-content>
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-lg font-medium">
                  {{transfer.amount | number:'1.2-2'}} €
                </h3>
                <p class="text-gray-600">
                  Fréquence: {{getFrequencyLabel(transfer.frequency)}}
                </p>
                <p class="text-gray-600">
                  Du {{transfer.startDate | date}} au {{transfer.endDate | date}}
                </p>
                <p class="text-gray-600" *ngIf="transfer.description">
                  {{transfer.description}}
                </p>
              </div>
              <div class="flex gap-2">
                <button mat-icon-button color="primary" (click)="openEditDialog(transfer)"
                        [disabled]="!transfer.active">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="cancelTransfer(transfer)"
                        [disabled]="!transfer.active">
                  <mat-icon>cancel</mat-icon>
                </button>
              </div>
            </div>
            <div class="mt-2">
              <div class="chip-list">
                <span class="status-chip" [class.active]="transfer.active" [class.inactive]="!transfer.active">
                  {{transfer.active ? 'Actif' : 'Inactif'}}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <div *ngIf="transfers.length === 0" class="text-center py-8 text-gray-500">
          Aucun virement permanent programmé
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .grid {
      display: grid;
      gap: 1rem;
    }

    mat-card {
      margin-bottom: 1rem;
    }

    .flex {
      display: flex;
    }

    .justify-between {
      justify-content: space-between;
    }

    .items-center {
      align-items: center;
    }

    .items-start {
      align-items: flex-start;
    }

    .mb-6 {
      margin-bottom: 1.5rem;
    }

    .mt-2 {
      margin-top: 0.5rem;
    }

    .p-4 {
      padding: 1rem;
    }

    .gap-2 {
      gap: 0.5rem;
    }

    .text-2xl {
      font-size: 1.5rem;
    }

    .text-lg {
      font-size: 1.125rem;
    }

    .font-semibold {
      font-weight: 600;
    }

    .font-medium {
      font-weight: 500;
    }

    .text-gray-800 {
      color: #1f2937;
    }

    .text-gray-600 {
      color: #4b5563;
    }

    .text-gray-500 {
      color: #6b7280;
    }

    .chip-list {
      display: flex;
      gap: 0.5rem;
    }

    .status-chip {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-chip.active {
      background-color: #34d399;
      color: #064e3b;
    }

    .status-chip.inactive {
      background-color: #f87171;
      color: #7f1d1d;
    }
  `]
})
export class ScheduledTransferListComponent implements OnInit {
  transfers: ScheduledTransfer[] = [];

  constructor(
    private scheduledTransferService: ScheduledTransferService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadTransfers();
  }

  loadTransfers() {
    this.scheduledTransferService.getActiveTransfers().subscribe({
      next: (data) => {
        this.transfers = data;
      },
      error: (error) => {
        this.snackBar.open('Erreur lors du chargement des virements permanents', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(ScheduledTransferFormComponent, {
      width: '500px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTransfers();
      }
    });
  }

  openEditDialog(transfer: ScheduledTransfer) {
    const dialogRef = this.dialog.open(ScheduledTransferFormComponent, {
      width: '500px',
      data: { mode: 'edit', transfer }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTransfers();
      }
    });
  }

  cancelTransfer(transfer: ScheduledTransfer) {
    if (confirm('Êtes-vous sûr de vouloir annuler ce virement permanent ?')) {
      this.scheduledTransferService.cancelScheduledTransfer(transfer.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open(response.message, 'Fermer', {
              duration: 3000
            });
            this.loadTransfers();
          } else {
            this.snackBar.open(response.message, 'Fermer', {
              duration: 3000
            });
          }
        },
        error: (error) => {
          const message = error.error?.message || 'Erreur lors de l\'annulation du virement';
          this.snackBar.open(message, 'Fermer', {
            duration: 3000
          });
          // Reload transfers anyway as the operation might have succeeded
          this.loadTransfers();
        }
      });
    }
  }

  getFrequencyLabel(frequency: Frequency): string {
    switch (frequency) {
      case Frequency.DAILY:
        return 'Quotidien';
      case Frequency.WEEKLY:
        return 'Hebdomadaire';
      case Frequency.MONTHLY:
        return 'Mensuel';
      default:
        return frequency;
    }
  }
} 