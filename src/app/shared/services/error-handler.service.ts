import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';

export interface AppError {
  id: string;
  type: 'network' | 'validation' | 'permission' | 'unknown';
  message: string;
  details?: any;
  timestamp: number;
  handled: boolean;
}

/**
 * Globaler Error Handler Service
 * Zentralisiert Error-Behandlung und User-Feedback
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private toastService = inject(ToastService);
  private errors: AppError[] = [];

  /**
   * Behandelt verschiedene Arten von Fehlern
   */
  handleError(error: any, context?: string): void {
    const appError = this.createAppError(error, context);
    this.errors.push(appError);
    
    // User-freundliche Benachrichtigung
    this.showUserFriendlyError(appError);
    
    // Logging (in Produktion könnte hier ein externes Service verwendet werden)
    this.logError(appError);
  }

  /**
   * Erstellt ein strukturiertes AppError-Objekt
   */
  private createAppError(error: any, context?: string): AppError {
    const errorType = this.determineErrorType(error);
    const message = this.getErrorMessage(error, errorType);
    
    return {
      id: this.generateErrorId(),
      type: errorType,
      message: context ? `${context}: ${message}` : message,
      details: error,
      timestamp: Date.now(),
      handled: false
    };
  }

  /**
   * Bestimmt den Fehlertyp basierend auf dem Error-Objekt
   */
  private determineErrorType(error: any): AppError['type'] {
    if (error.name === 'NetworkError' || error.status === 0) {
      return 'network';
    }
    
    if (error.status >= 400 && error.status < 500) {
      return 'validation';
    }
    
    if (error.status === 403 || error.status === 401) {
      return 'permission';
    }
    
    return 'unknown';
  }

  /**
   * Extrahiert eine benutzerfreundliche Fehlermeldung
   */
  private getErrorMessage(error: any, type: AppError['type']): string {
    // Strukturierte Fehlermeldungen vom Backend
    if (error.error?.message) {
      return error.error.message;
    }
    
    // HTTP Status basierte Meldungen
    if (error.status) {
      switch (error.status) {
        case 404: return 'Die angeforderte Ressource wurde nicht gefunden.';
        case 403: return 'Sie haben keine Berechtigung für diese Aktion.';
        case 401: return 'Bitte melden Sie sich erneut an.';
        case 500: return 'Ein Serverfehler ist aufgetreten.';
        case 503: return 'Der Service ist vorübergehend nicht verfügbar.';
      }
    }
    
    // Typ-basierte Fallback-Meldungen
    switch (type) {
      case 'network':
        return 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
      case 'validation':
        return 'Die eingegebenen Daten sind ungültig.';
      case 'permission':
        return 'Sie haben keine Berechtigung für diese Aktion.';
      default:
        return error.message || 'Ein unbekannter Fehler ist aufgetreten.';
    }
  }

  /**
   * Zeigt benutzerfreundliche Fehlermeldung an
   */
  private showUserFriendlyError(appError: AppError): void {
    const actions = this.getErrorActions(appError);
    
    if (actions.length > 0) {
      this.toastService.showWithAction(
        'error',
        appError.message,
        actions[0].label,
        actions[0].handler,
        8000
      );
    } else {
      this.toastService.error(appError.message, 6000);
    }
    
    appError.handled = true;
  }

  /**
   * Bestimmt verfügbare Aktionen für verschiedene Fehlertypen
   */
  private getErrorActions(appError: AppError): Array<{label: string, handler: () => void}> {
    switch (appError.type) {
      case 'network':
        return [{
          label: 'Erneut versuchen',
          handler: () => window.location.reload()
        }];
        
      case 'permission':
        return [{
          label: 'Neu anmelden',
          handler: () => {
            // Hier könnte Logout-Logik implementiert werden
            this.toastService.info('Bitte melden Sie sich erneut an.');
          }
        }];
        
      default:
        return [];
    }
  }

  /**
   * Loggt Fehler für Debugging/Monitoring
   */
  private logError(appError: AppError): void {
    const logData = {
      id: appError.id,
      type: appError.type,
      message: appError.message,
      timestamp: new Date(appError.timestamp).toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      details: appError.details
    };
    
    // Console Logging für Development
    if (typeof window !== 'undefined' && window.console) {
      console.group(`🚨 App Error [${appError.type}]`);
      console.error('Message:', appError.message);
      console.error('Details:', appError.details);
      console.error('Full Error Object:', logData);
      console.groupEnd();
    }
    
    // Hier könnte in Produktion ein externes Monitoring-Service 
    // wie Sentry, LogRocket, oder ein eigenes Backend angebunden werden
    // this.sendToMonitoringService(logData);
  }

  /**
   * Validation-spezifische Fehlerbehandlung
   */
  handleValidationError(field: string, message: string): void {
    this.toastService.warning(`${field}: ${message}`, 4000);
  }

  /**
   * Zeigt eine generische "Etwas ist schiefgelaufen" Meldung
   */
  showGenericError(): void {
    this.toastService.error(
      'Ups! Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
      5000
    );
  }

  /**
   * Gibt alle Fehler zurück (für Debugging)
   */
  getAllErrors(): AppError[] {
    return [...this.errors];
  }

  /**
   * Löscht alle Fehler
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Generiert eine eindeutige Error-ID
   */
  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}