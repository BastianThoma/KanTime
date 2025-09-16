import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkdayService } from '../../state/workday/workday.service';
import { Store } from '@ngrx/store';
import { saveWorkday, loadWorkdays, deleteWorkday } from '../../state/workday/workday.actions';

@Component({
  selector: 'app-workday-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workday-calendar.html',
  styleUrl: './workday-calendar.scss',
})
export class WorkdayCalendar {
  private workdayService = inject(WorkdayService);
  private cdr = inject(ChangeDetectorRef);
  private store = inject(Store);
  workdays: any[] = [];
  tasks$ = this.store.select((state: any) => state.task.tasks);
  
  // Edit-Modus Properties
  editingWorkdayId: string | null = null;
  editWorkday: any = null;
  showDeleteConfirm: string | null = null;

  ngOnInit() {
    // TODO: User-ID aus Firebase Auth holen, sobald Auth integriert ist
    const userId = 'testuser';
    this.loadWorkdays(userId);
  }

  async loadWorkdays(userId: string) {
    try {
      const workdays = await this.workdayService.getWorkdays(userId);
      // Sortiere Workdays nach Datum (neueste zuerst)
      this.workdays = workdays.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      this.cdr.detectChanges();
      console.log('Geladene Workdays:', this.workdays.map(w => ({ id: w.id, date: w.date, sections: w.sections.length })));
    } catch (error) {
      console.error('Fehler beim Laden der Workdays:', error);
      this.workdays = [];
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('de-DE');
  }

  toDate(ts: number | null | undefined): Date {
    return ts ? new Date(ts) : new Date();
  }

  getTaskTitle(taskId: string): string {
    let tasks: { id: string; title: string }[] = [];
    this.tasks$.subscribe((t: any[]) => (tasks = t)).unsubscribe();
    const found = tasks.find(task => task.id === taskId);
    return found ? found.title : taskId;
  }

  /**
   * Berechnet die Gesamtarbeitszeit für alle Work-Abschnitte eines Workdays
   */
  calculateWorkTime(sections: any[]): string {
    const workSections = sections.filter(s => s.type === 'work');
    const totalMs = workSections.reduce((sum, section) => {
      const duration = (section.end ?? Date.now()) - section.start;
      return sum + duration;
    }, 0);
    
    return this.formatDurationMs(totalMs);
  }

  /**
   * Formatiert eine Dauer zwischen zwei Timestamps
   */
  formatDuration(start: number, end: number | null): string {
    if (!end) return 'Läuft...';
    const duration = end - start;
    return this.formatDurationMs(duration);
  }

  /**
   * Formatiert Millisekunden in lesbare Zeitangabe
   */
  private formatDurationMs(ms: number): string {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  }

  // ================== EDIT FUNKTIONEN ==================

  /**
   * Startet den Bearbeitungsmodus für einen Workday
   */
  startEditing(workday: any) {
    this.editingWorkdayId = workday.date;
    // Deep clone um Original nicht zu verändern
    this.editWorkday = JSON.parse(JSON.stringify(workday));
  }

  /**
   * Bricht die Bearbeitung ab
   */
  cancelEditing() {
    this.editingWorkdayId = null;
    this.editWorkday = null;
  }

  /**
   * Speichert die Änderungen am Workday
   */
  async saveWorkday() {
    if (!this.editWorkday) return;

    try {
      // Validierung
      if (!this.validateWorkday(this.editWorkday)) return;

      // Im Service speichern
      await this.workdayService.saveWorkday(this.editWorkday);
      
      // Store aktualisieren
      this.store.dispatch(saveWorkday({ workday: this.editWorkday }));
      this.store.dispatch(loadWorkdays());

      // Lokale Liste aktualisieren
      const index = this.workdays.findIndex(w => w.date === this.editWorkday.date);
      if (index >= 0) {
        this.workdays[index] = { ...this.editWorkday };
      }

      this.cancelEditing();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Änderungen!');
    }
  }

  /**
   * Löscht einen ganzen Workday
   */
  async deleteWorkday(workday: any) {
    const confirmText = `Möchtest du diesen Arbeitstag wirklich löschen?\n\nDatum: ${this.formatDate(workday.date)}\nSections: ${workday.sections.length}\nArbeitszeit: ${this.calculateWorkTime(workday.sections)}\nID: ${workday.id}`;
    
    if (!confirm(confirmText)) {
      return;
    }

    try {
      // Prüfen ob workday eine ID hat
      if (!workday.id) {
        console.error('Workday hat keine ID:', workday);
        alert('Fehler: Workday kann nicht gelöscht werden (keine ID)');
        return;
      }

      await this.workdayService.deleteWorkday(workday.id);
      
      // Store aktualisieren mit spezifischer Delete-Action
      this.store.dispatch(deleteWorkday({ workdayId: workday.id }));
      this.store.dispatch(loadWorkdays());
      
      // Aus lokaler Liste entfernen (nur den spezifischen Workday)
      this.workdays = this.workdays.filter(w => w.id !== workday.id);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen des Arbeitstags!');
    }
  }

  /**
   * Fügt eine neue Section hinzu
   */
  addSection() {
    if (!this.editWorkday) return;

    const lastSection = this.editWorkday.sections[this.editWorkday.sections.length - 1];
    const newStart = lastSection ? lastSection.end || Date.now() : Date.now();

    const newSection = {
      type: 'work',
      start: newStart,
      end: newStart + 3600000, // 1 Stunde default
      taskId: null
    };

    this.editWorkday.sections.push(newSection);
  }

  /**
   * Löscht eine Section
   */
  deleteSection(index: number) {
    if (!this.editWorkday) return;
    
    if (confirm('Diese Section wirklich löschen?')) {
      this.editWorkday.sections.splice(index, 1);
    }
  }

  /**
   * Formatiert Timestamp für Input-Feld
   */
  formatForInput(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  }

  /**
   * Konvertiert Input-Wert zurück zu Timestamp
   */
  parseFromInput(value: string): number {
    return new Date(value).getTime();
  }

  /**
   * Handler für Start-Zeit Änderung
   */
  onStartTimeChange(section: any, event: Event) {
    const input = event.target as HTMLInputElement;
    section.start = this.parseFromInput(input.value);
  }

  /**
   * Handler für End-Zeit Änderung
   */
  onEndTimeChange(section: any, event: Event) {
    const input = event.target as HTMLInputElement;
    section.end = this.parseFromInput(input.value);
  }

  /**
   * Validiert Workday-Daten
   */
  private validateWorkday(workday: any): boolean {
    for (let i = 0; i < workday.sections.length; i++) {
      const section = workday.sections[i];
      
      // Start muss vor End sein
      if (section.end && section.start >= section.end) {
        alert(`Section ${i + 1}: Startzeit muss vor Endzeit liegen!`);
        return false;
      }

      // Überschneidungen prüfen
      for (let j = i + 1; j < workday.sections.length; j++) {
        const other = workday.sections[j];
        if (this.sectionsOverlap(section, other)) {
          alert(`Sections ${i + 1} und ${j + 1} überschneiden sich!`);
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Prüft ob zwei Sections sich überschneiden
   */
  private sectionsOverlap(a: any, b: any): boolean {
    const aEnd = a.end || Date.now();
    const bEnd = b.end || Date.now();
    
    return (a.start < bEnd && aEnd > b.start);
  }
}
