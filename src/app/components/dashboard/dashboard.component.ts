import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  events: EventRecord[] = [];
  totalIncidents = 0;
  incidentCategories: IncidentCategory[] = [];

  constructor(
    private stateService: StateService,
    private mapDataService: MapDataService
  ) {
    this.username = this.stateService.getState('username');
  }

  ngOnInit(): void {
    this.mapDataService.getAllEvents().subscribe({
      next: (res) => {
        const all = res.events || [];
        this.events = all;
        this.totalIncidents = all.length;

        this.computeIncidentCategories();
      },
      error: (err) => console.error('Failed to load events:', err)
    });
  }

  private computeIncidentCategories() {
    const catMap: Record<string, number> = {};

    for (const e of this.events) {
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

    this.incidentCategories = Object.keys(catMap).map(k => ({
      label: k,
      count: catMap[k]
    }));

    this.incidentCategories.sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }
}
