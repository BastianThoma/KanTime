import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorkdayTracker } from './components/workday-tracker/workday-tracker';
import { Navbar } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WorkdayTracker, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'KanTime';
}
