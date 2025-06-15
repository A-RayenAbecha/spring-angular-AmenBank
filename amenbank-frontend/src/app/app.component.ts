import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavBarComponent],
  template: `
    <div [class]="isDarkTheme ? 'dark-theme' : 'light-theme'" class="app-container theme-transition">
      <app-nav-bar></app-nav-bar>
      <main class="main-content theme-transition">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background-color: var(--background);
      color: var(--text-primary);
    }

    .main-content {
      min-height: calc(100vh - 64px);
      background-color: var(--background);
      color: var(--text-primary);
    }
  `]
})
export class AppComponent implements OnInit {
  isDarkTheme = false;

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    this.themeService.isDarkTheme$.subscribe(
      isDark => this.isDarkTheme = isDark
    );
  }
}
