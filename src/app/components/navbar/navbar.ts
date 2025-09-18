import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

/**
 * Navbar Komponente für die Hauptnavigation
 * Modernes, responsives Design mit glasmorphism Effekt
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  private router = inject(Router);
  
  /** Mobile Menu Toggle State */
  isMobileMenuOpen = false;

  /**
   * Navigation Items mit Icons und Routen
   */
  navItems = [
    {
      label: 'Dashboard',
      route: '/',
      icon: '📊',
      description: 'Übersicht und Statistiken'
    },
    {
      label: 'Tasks',
      route: '/tasks',
      icon: '✅',
      description: 'Aufgaben verwalten'
    },
    {
      label: 'Kalender',
      route: '/workday-calendar',
      icon: '📅',
      description: 'Arbeitszeiten eintragen'
    }
  ];

  /**
   * Prüft ob die aktuelle Route aktiv ist
   * @param route - Die zu prüfende Route
   * @returns true wenn die Route aktiv ist
   */
  isActiveRoute(route: string): boolean {
    if (route === '/') {
      return this.router.url === '/';
    }
    return this.router.url.startsWith(route);
  }

  /**
   * Togglet das mobile Menu
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  /**
   * Schließt das mobile Menu beim Navigation
   */
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  /**
   * Navigiert zu einer Route und schließt mobile Menu
   * @param route - Ziel-Route
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.closeMobileMenu();
  }
}