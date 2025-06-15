import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material Imports
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatOptionModule } from '@angular/material/core';

import { LogService, LoginEvent, LogFilter } from '../services/logs-service.service';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatOptionModule
  ],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.scss'
})
export class LogsComponent implements OnInit {
  logs: LoginEvent[] = [];
  filteredLogs: LoginEvent[] = [];
  loading = false;
  isLoading = false;
  error: string | null = null;
  errorMessage: string | null = null;

  // Filter properties
  filter: LogFilter = {};

  // Table columns
  displayedColumns: string[] = ['id', 'timestamp', 'username', 'ipAddress', 'userAgent'];

  constructor(private logService: LogService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.isLoading = true;
    this.error = null;
    this.errorMessage = null;
    
    this.logService.getAllLogs().subscribe({
      next: (data) => {
        this.logs = data;
        this.filteredLogs = data;
        this.loading = false;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load logs. Please try again.';
        this.errorMessage = 'Failed to load logs. Please try again.';
        this.loading = false;
        this.isLoading = false;
        console.error('Error loading logs:', err);
      }
    });
  }

  applyFilter(): void {
    // Convert Date objects to ISO string format for the backend
    const filterToSend = { ...this.filter };
    
    if (filterToSend.start && filterToSend.start instanceof Date) {
      // Convert to full ISO string with time (start of day)
      const startDate = new Date(filterToSend.start);
      startDate.setHours(0, 0, 0, 0); // Set to start of day
      filterToSend.start = startDate.toISOString();
    }
    
    if (filterToSend.end && filterToSend.end instanceof Date) {
      // Convert to full ISO string with time (end of day)
      const endDate = new Date(filterToSend.end);
      endDate.setHours(23, 59, 59, 999); // Set to end of day
      filterToSend.end = endDate.toISOString();
    }
    
    this.loading = true;
    this.isLoading = true;
    this.error = null;
    this.errorMessage = null;
    
    this.logService.getFilteredLogs(filterToSend).subscribe({
      next: (data) => {
        this.logs = data;
        this.filteredLogs = data;
        this.loading = false;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load logs. Please try again.';
        this.errorMessage = 'Failed to load logs. Please try again.';
        this.loading = false;
        this.isLoading = false;
        console.error('Error loading logs:', err);
      }
    });
  }

  clearFilter(): void {
    this.filter = {};
    this.loadLogs();
  }

  refreshLogs(): void {
    this.loadLogs();
  }

  exportLogs(): void {
    // Implement export functionality
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `login_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private generateCSV(): string {
    const headers = ['ID', 'Timestamp', 'Username', 'IP Address', 'User Agent'];
    const csvRows = [headers.join(',')];
    
    this.logs.forEach(log => {
      const row = [
        log.id?.toString() || '',
        log.timestamp || '',
        log.username || '',
        log.ipAddress || '',
        `"${log.userAgent?.replace(/"/g, '""') || ''}"` // Escape quotes in user agent
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatUserAgent(userAgent: string): string {
    if (!userAgent) return 'N/A';
    
    // Extract browser info from user agent
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Other';
  }

  getIPAddressClass(ipAddress: string): string {
    // You can implement logic to classify IP addresses
    // For example, internal vs external IPs
    if (ipAddress?.startsWith('192.168.') || 
        ipAddress?.startsWith('10.') || 
        ipAddress?.startsWith('172.')) {
      return 'internal';
    }
    return 'external';
  }

  trackByLogId(index: number, log: LoginEvent): number | undefined {
    return log.id;
  }
}