import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorkdayTracker } from './components/workday-tracker/workday-tracker';
import { Navbar } from './components/navbar/navbar';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { PWAService } from './shared/services/pwa.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WorkdayTracker, Navbar, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'KanTime';
  private pwaService = inject(PWAService);

  ngOnInit(): void {
    // PWA Service initialisieren
    this.pwaService.checkForUpdates();
  }
}
