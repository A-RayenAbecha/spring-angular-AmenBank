import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TransferNotificationService, TransferNotification } from '../../services/transfer-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transfer-notification-list',
  standalone: true,
  imports: [
    CommonModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  template: `
    <div class="notification-container">
      <button mat-icon-button 
              [matMenuTriggerFor]="menu" 
              [matBadge]="unreadCount" 
              [matBadgeHidden]="unreadCount === 0"
              matBadgeColor="warn"
              class="notification-button">
        <mat-icon [class.has-notifications]="unreadCount > 0">notifications</mat-icon>
      </button>

      <mat-menu #menu="matMenu" class="notification-menu">
        <div class="notification-panel">
          <div class="notification-header">
            <h3 class="notification-title">Notifications</h3>
            <button mat-button 
                    class="mark-all-read" 
                    *ngIf="unreadCount > 0"
                    (click)="markAllAsRead(); $event.stopPropagation()">
              <mat-icon class="mark-all-icon">done_all</mat-icon>
              Tout marquer comme lu
            </button>
          </div>
          
          <div class="notification-list">
            <div *ngIf="notifications.length === 0" class="empty-notifications">
              <mat-icon>notifications_off</mat-icon>
              <p>Aucune notification</p>
            </div>

            <div *ngFor="let notification of notifications" 
                 class="notification-item"
                 [class.unread]="!notification.isRead"
                 (click)="markAsRead(notification)">
              <div class="notification-icon">
                <mat-icon [class.reminder-icon]="notification.isReminder" 
                         [class.success-icon]="!notification.isReminder">
                  {{ notification.isReminder ? 'alarm' : 'check_circle' }}
                </mat-icon>
              </div>
              <div class="notification-content">
                <p class="notification-message">{{ notification.message }}</p>
                <span class="notification-date">
                  {{ notification.notificationDate | date:'dd/MM/yyyy HH:mm' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </mat-menu>
    </div>
  `,
  styles: [`
    /* Notification Container */
    .notification-container {
      position: relative;
      display: inline-block;
    }

    .notification-button {
      position: relative;
      transition: transform 0.2s ease;
    }

    .notification-button:hover {
      transform: scale(1.1);
    }

    .has-notifications {
      color: var(--primary);
    }

    /* Badge Styling */
    :host ::ng-deep .mat-badge-content {
      font-family: var(--font-family);
      font-size: var(--font-size-xs);
      font-weight: 600;
      min-width: 20px;
      height: 20px;
      line-height: 20px;
      right: -8px !important;
      top: -8px !important;
    }

    /* Menu Panel */
    .notification-panel {
      width: 360px;
      max-width: 90vw;
      max-height: 480px;
      display: flex;
      flex-direction: column;
      background-color: white;
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    /* Header */
    .notification-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-4);
      border-bottom: 1px solid var(--gray-200);
      background-color: var(--gray-50);
    }

    .notification-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--gray-900);
      margin: 0;
    }

    .mark-all-read {
      font-size: var(--font-size-sm);
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: var(--spacing-1);
    }

    .mark-all-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Notification List */
    .notification-list {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-2);
    }

    /* Empty State */
    .empty-notifications {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-8);
      color: var(--gray-500);
      text-align: center;
    }

    .empty-notifications mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: var(--spacing-4);
      opacity: 0.5;
    }

    /* Notification Item */
    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: var(--spacing-3);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background-color 0.2s ease;
      margin-bottom: var(--spacing-2);
    }

    .notification-item:last-child {
      margin-bottom: 0;
    }

    .notification-item:hover {
      background-color: var(--gray-100);
    }

    .notification-item.unread {
      background-color: var(--primary-light);
      background-opacity: 0.1;
    }

    .notification-icon {
      flex-shrink: 0;
      margin-right: var(--spacing-3);
    }

    .reminder-icon {
      color: var(--info);
    }

    .success-icon {
      color: var(--success);
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-message {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--gray-900);
      line-height: 1.4;
    }

    .notification-date {
      display: block;
      font-size: var(--font-size-xs);
      color: var(--gray-500);
      margin-top: var(--spacing-1);
    }

    /* Responsive Design */
    @media (max-width: 480px) {
      .notification-panel {
        width: 100vw;
        max-width: 100vw;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
      }

      .notification-header {
        position: sticky;
        top: 0;
        z-index: 1;
      }

      .notification-list {
        padding: var(--spacing-3);
      }
    }
  `]
})
export class TransferNotificationListComponent implements OnInit, OnDestroy {
  notifications: TransferNotification[] = [];
  unreadCount = 0;
  private subscription: Subscription | null = null;

  constructor(private notificationService: TransferNotificationService) {}

  ngOnInit() {
    this.loadNotifications();
    this.subscription = this.notificationService.notifications$.subscribe(
      notifications => {
        this.notifications = notifications;
        this.unreadCount = notifications.filter(n => !n.isRead).length;
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadNotifications() {
    this.notificationService.getUnreadNotifications().subscribe();
  }

  markAsRead(notification: TransferNotification) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe();
  }
} 