import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NotificationService, TransferNotification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [
    CommonModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="menu" 
            [matBadge]="unreadCount" 
            [matBadgeHidden]="unreadCount === 0"
            matBadgeColor="warn"
            class="notification-button">
      <mat-icon>notifications</mat-icon>
    </button>

    <mat-menu #menu="matMenu" class="notification-menu">
      <div class="p-2 min-w-[300px] max-w-[400px]">
        <div class="text-lg font-semibold mb-2">Notifications</div>
        
        <div *ngIf="notifications.length === 0" class="text-gray-500 text-center py-4">
          Aucune notification
        </div>

        <div *ngFor="let notification of notifications" 
             class="notification-item p-3 border-b last:border-b-0 cursor-pointer"
             [class.unread]="!notification.isRead"
             (click)="markAsRead(notification)">
          <div class="flex items-start gap-2">
            <mat-icon [class.text-blue-500]="notification.isReminder" 
                     [class.text-green-500]="!notification.isReminder">
              {{ notification.isReminder ? 'alarm' : 'check_circle' }}
            </mat-icon>
            <div class="flex-1">
              <div class="text-sm">{{ notification.message }}</div>
              <div class="text-xs text-gray-500 mt-1">
                {{ notification.notificationDate | date:'dd/MM/yyyy HH:mm' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </mat-menu>
  `,
  styles: [`
    .notification-button {
      position: relative;
    }

    .notification-item {
      transition: background-color 0.2s;
    }

    .notification-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .notification-item.unread {
      background-color: rgba(25, 118, 210, 0.05);
    }

    .notification-item.unread:hover {
      background-color: rgba(25, 118, 210, 0.08);
    }
  `]
})
export class NotificationListComponent implements OnInit, OnDestroy {
  notifications: TransferNotification[] = [];
  unreadCount = 0;
  private subscription: Subscription | null = null;

  constructor(private notificationService: NotificationService) {}

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
} 