import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface Transaction {
  date: string;
  type: string;
  description: string;
  amount: number;
  status: string;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="transactions-container mat-app-background" [class.dark-theme]="isDarkTheme" [class.light-theme]="!isDarkTheme">
      <div class="transactions-header">
        <h1>Transactions</h1>
        <p>View and manage your transaction history</p>
      </div>
      
      <mat-card class="transactions-filters" [class.mat-elevation-z4]="!isDarkTheme" [class.mat-elevation-z8]="isDarkTheme">
        <div class="filters-grid">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search transactions</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="Type to search...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>
      </mat-card>
      
      <mat-card class="transactions-table" [class.mat-elevation-z4]="!isDarkTheme" [class.mat-elevation-z8]="isDarkTheme">
        <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z0">
          <!-- Date Column -->
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Date </th>
            <td mat-cell *matCellDef="let row"> {{row.date}} </td>
          </ng-container>

          <!-- Type Column -->
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Type </th>
            <td mat-cell *matCellDef="let row" class="type-cell"> {{row.type}} </td>
          </ng-container>

          <!-- Description Column -->
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Description </th>
            <td mat-cell *matCellDef="let row" class="description-cell"> {{row.description}} </td>
          </ng-container>

          <!-- Amount Column -->
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Amount </th>
            <td mat-cell *matCellDef="let row">
              <span class="transaction-amount" [class.credit]="row.amount > 0" [class.debit]="row.amount < 0">
                {{row.amount | currency}}
              </span>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Status </th>
            <td mat-cell *matCellDef="let row">
              <span class="transaction-status" [class]="row.status.toLowerCase()">
                {{row.status}}
              </span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]" aria-label="Select page of transactions"></mat-paginator>
      </mat-card>
    </div>
  `,
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
  isDarkTheme = false;
  displayedColumns: string[] = ['date', 'type', 'description', 'amount', 'status'];
  dataSource: MatTableDataSource<Transaction>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private themeService: ThemeService) {
    this.dataSource = new MatTableDataSource<Transaction>([]);
  }

  ngOnInit() {
    this.themeService.isDarkTheme$.subscribe(
      isDark => {
        this.isDarkTheme = isDark;
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        });
      }
    );

    const EXAMPLE_DATA: Transaction[] = [
      { date: '2024-03-20', type: 'Transfer', description: 'Monthly transfer', amount: 1000, status: 'Completed' },
      { date: '2024-03-19', type: 'Withdrawal', description: 'ATM withdrawal', amount: -500, status: 'Completed' },
      { date: '2024-03-18', type: 'Deposit', description: 'Salary deposit', amount: 5000, status: 'Completed' },
    ];

    this.dataSource = new MatTableDataSource<Transaction>(EXAMPLE_DATA);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
} 