import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  
import { StateService } from '../../services/state.service';
import { MapDataService, EventRecord } from '../map/map-data.service';

import { DashboardMapComponent } from './dashboard-map.component';
import { DonutChartComponent } from './donut-chart.component';
import { MultiLineChartComponent } from './multi-line-chart.component';
import { LogoutButtonComponent } from '../../shared/logout-button.component';

interface IncidentCategory {
  label: string;
  count: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,            
    DashboardMapComponent,
    DonutChartComponent,
    MultiLineChartComponent,
    LogoutButtonComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  username: string | null = null;


  allEvents: EventRecord[] = [];

  filteredEvents: EventRecord[] = [];


  dateFrom: string | null = null;
  dateTo: string | null = null;


  incidentCategories: IncidentCategory[] = [];
  totalIncidents = 0;

  constructor(
    private stateService: StateService,
    private mapDataService: MapDataService
  ) {
    this.username = this.stateService.getState('username');
  }

  ngOnInit(): void {

    this.mapDataService.getAllEvents().subscribe({
      next: (res) => {
        this.allEvents = res.events || [];
        this.filteredEvents = [...this.allEvents];
        this.computeAll();
        console.log("recieved events:", res)
      },
      error: (err) => console.error('Failed to load events:', err)
    });
  }


  applyTimeFilter() {
    if (!this.dateFrom && !this.dateTo) {
      this.filteredEvents = [...this.allEvents];
    } else {
      this.filteredEvents = this.allEvents.filter(e => {
        const d = new Date(e.date_created).getTime();
        if (this.dateFrom) {
          const fromMs = new Date(this.dateFrom).getTime();
          if (d < fromMs) return false;
        }
        if (this.dateTo) {
          const toMs = new Date(this.dateTo).getTime();
          if (d > toMs) return false;
        }
        return true;
      });
    }
    this.computeAll();
  }


  clearFilter() {

    this.dateFrom = null;
    this.dateTo = null;
    this.filteredEvents = [...this.allEvents];
    this.computeAll();
  }


  private computeAll() {
    this.totalIncidents = this.filteredEvents.length;

    const catMap: Record<string, number> = {};
    for (const e of this.filteredEvents) {
      let label = '';
      if (e.device_event_type_id === 40) {
        label = 'Fall';
      } else if (e.device_event_type_id === 42) {
        label = 'Silent Alert';
      } else if (e.device_event_type_id === 43) {
        label = 'Emergency';
      }
      if (!label && e.gas_type) {
        label = e.gas_type.toUpperCase();
      }
      if (!label) continue;

      if (!catMap[label]) {
        catMap[label] = 0;
      }
      catMap[label]++;
    }

    const arr = Object.keys(catMap).map(k => ({
      label: k,
      count: catMap[k]
    }));
    arr.sort((a, b) => a.label.localeCompare(b.label));
    this.incidentCategories = arr;
  }
}
