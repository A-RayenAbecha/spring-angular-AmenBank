import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from '../components/nav-bar/nav-bar.component';
import { ThemeService } from '../../services/theme.service';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavBarComponent, MatSidenavModule],
  template: `
    <div class="client-layout" [class.dark-theme]="isDarkTheme" [class.light-theme]="!isDarkTheme">
      <app-nav-bar></app-nav-bar>
      <main class="main-content">
        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styleUrls: ['./client-layout.component.scss']
})
export class ClientLayoutComponent implements OnInit {
  isDarkTheme = false;

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    this.themeService.isDarkTheme$.subscribe(
      isDark => {
        this.isDarkTheme = isDark;
        // Force re-render of Material components
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        });
      }
    );
  }
} 