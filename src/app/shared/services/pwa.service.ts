import { Injectable, signal } from '@angular/core';
import { ToastService } from './toast.service';

export interface NetworkStatus {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

/**
 * PWA Service für Offline-Funktionalität und App-Features
 * Verwaltet Service Worker, Offline-Status und App-Installation
 */
@Injectable({
  providedIn: 'root'
})
export class PWAService {
  private networkStatus = signal<NetworkStatus>({ online: navigator.onLine });
  private installPrompt: any = null;

  /**
   * Aktueller Network-Status als readonly Signal
   */
  readonly networkStatus$ = this.networkStatus.asReadonly();

  constructor(private toastService: ToastService) {
    this.initializeNetworkMonitoring();
    this.initializePWAPrompt();
  }

  /**
   * Initialisiert Network-Status Monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Online/Offline Events
    window.addEventListener('online', () => {
      this.updateNetworkStatus(true);
      this.toastService.success('Verbindung wiederhergestellt! 🌐', 2000);
    });

    window.addEventListener('offline', () => {
      this.updateNetworkStatus(false);
      this.toastService.warning('Offline-Modus aktiviert. Änderungen werden synchronisiert, sobald die Verbindung wieder verfügbar ist.', 5000);
    });

    // Network Information API (falls verfügbar)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const updateConnectionInfo = () => {
        this.updateNetworkStatus(navigator.onLine, {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      };

      connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo();
    }
  }

  /**
   * Initialisiert PWA Install Prompt
   */
  private initializePWAPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event;
      
      // Zeige Install-Toast nach 30 Sekunden
      setTimeout(() => {
        this.toastService.showWithAction(
          'info',
          'KanTime als App installieren für bessere Performance und Offline-Nutzung! 📱',
          'Installieren',
          () => this.installPWA(),
          10000
        );
      }, 30000);
    });

    // Track App Installation
    window.addEventListener('appinstalled', () => {
      this.toastService.success('KanTime wurde erfolgreich als App installiert! 🎉');
      this.installPrompt = null;
    });
  }

  /**
   * Aktualisiert den Network-Status
   */
  private updateNetworkStatus(online: boolean, additionalInfo?: Partial<NetworkStatus>): void {
    this.networkStatus.set({
      online,
      ...additionalInfo
    });
  }

  /**
   * Installiert die PWA
   */
  async installPWA(): Promise<boolean> {
    if (!this.installPrompt) {
      this.toastService.info('App-Installation ist nicht verfügbar oder bereits erfolgt.');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        this.toastService.success('Installation gestartet...');
        return true;
      } else {
        this.toastService.info('Installation abgebrochen.');
        return false;
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      this.toastService.error('Fehler bei der Installation.');
      return false;
    } finally {
      this.installPrompt = null;
    }
  }

  /**
   * Prüft ob die App installiert werden kann
   */
  canInstall(): boolean {
    return this.installPrompt !== null;
  }

  /**
   * Prüft ob die App im Standalone-Modus läuft
   */
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Registriert Service Worker Updates
   */
  checkForUpdates(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.update();
        }
      });
    }
  }

  /**
   * Zeigt Update-Benachrichtigung an
   */
  showUpdateAvailable(): void {
    this.toastService.showWithAction(
      'info',
      'Ein neues Update ist verfügbar! 🚀',
      'Neu laden',
      () => window.location.reload(),
      0 // Kein Auto-Hide
    );
  }

  /**
   * Gibt Connection-Quality als Text zurück
   */
  getConnectionQuality(): string {
    const status = this.networkStatus$();
    if (!status.online) return 'Offline';
    
    switch (status.effectiveType) {
      case 'slow-2g': return 'Sehr langsam';
      case '2g': return 'Langsam';
      case '3g': return 'Mittel';
      case '4g': return 'Schnell';
      default: return 'Online';
    }
  }

  /**
   * Prüft ob die Verbindung schnell genug für bestimmte Features ist
   */
  isConnectionFast(): boolean {
    const status = this.networkStatus$();
    return status.online && (!status.effectiveType || 
           ['3g', '4g'].includes(status.effectiveType));
  }
}