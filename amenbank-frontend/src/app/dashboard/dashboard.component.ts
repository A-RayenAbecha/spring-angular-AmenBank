import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LogoutService } from '../services/logout.service';
import { CommonModule } from '@angular/common';
import { filter, Subject, takeUntil } from 'rxjs';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ThemeToggleComponent } from '../components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterModule, 
    CommonModule, 
    NotificationPanelComponent,
    MatButtonModule,
    MatIconModule,
    ThemeToggleComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentRoute: string = '';
  pageTitle: string = 'Dashboard';
  pageSubtitle: string = 'Welcome back to your admin panel';
  userName: string = 'Admin User';
  userRole: string = 'Administrator';
  
  // Navigation items configuration
  navigationItems = [
    {
      route: 'users',
      label: 'Gestion Utilisateurs',
      icon: 'group'
    },
    {
      route: 'transactions',
      label: 'Gestion Transactions',
      icon: 'receipt_long'
    },
    {
      route: 'accounts',
      label: 'Gestion Comptes',
      icon: 'account_balance_wallet'
    },
    {
      route: 'scheduled-transfers',
      label: 'Gestion Virements',
      icon: 'sync_alt'
    },
    {
      route: 'loans',
      label: 'Gestion Crédits',
      icon: 'account_balance'
    },
    {
      route: 'logs',
      label: 'Gestion Logs',
      icon: 'list_alt'
    }
  ];

  // Page titles mapping
  private pageTitles: { [key: string]: { title: string; subtitle: string } } = {
    'users': {
      title: 'Gestion des Utilisateurs',
      subtitle: 'Gérez les comptes utilisateurs et leurs permissions'
    },
    'transactions': {
      title: 'Gestion des Transactions',
      subtitle: 'Surveillez et gérez toutes les transactions'
    },
    'accounts': {
      title: 'Gestion des Comptes Bancaires',
      subtitle: 'Gérez les comptes bancaires des clients'
    },
    'scheduled-transfers': {
      title: 'Gestion des Virements Permanents',
      subtitle: 'Gérez les virements permanents des clients'
    },
    'loans': {
      title: 'Gestion des Crédits',
      subtitle: 'Gérez les demandes de crédit des clients'
    },
    'logs': {
      title: 'Gestion des Logs',
      subtitle: 'Consultez les journaux d\'activité du système'
    },
    'dashboard': {
      title: 'Dashboard',
      subtitle: 'Welcome back to your admin panel'
    }
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private logoutService: LogoutService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      const path = event.url.split('/').pop();
      this.updatePageTitle(path);
    });
  }

  ngOnInit() {
    const currentPath = this.router.url.split('/').pop();
    this.updatePageTitle(currentPath || 'dashboard');

    // Subscribe to user info
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.userName = user?.username || 'Admin User';
        this.userRole = user?.role || 'Administrator';
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updatePageTitle(path: string) {
    const pageInfo = this.pageTitles[path] || this.pageTitles['dashboard'];
    this.pageTitle = pageInfo.title;
    this.pageSubtitle = pageInfo.subtitle;
  }

  onLogout() {
    this.logoutService.initiateLogout();
  }

  getUserName(): string {
    return this.userName;
  }

  getUserRole(): string {
    return this.userRole;
  }

  // Method for handling notifications (to be implemented)
  onNotificationClick(): void {
    console.log('Notifications clicked');
    // Implement notification handling logic
  }

  // Method for handling settings (to be implemented)
  onSettingsClick(): void {
    console.log('Settings clicked');
    // Implement settings logic or navigate to settings page
  }

  // Method to get notification count (to be implemented)
  getNotificationCount(): number {
    // This should return the actual notification count
    return 3;
  }
}