import {
  AfterViewInit,
  Component,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { MapDataService, EventRecord, EventType } from './map-data.service';

interface IncidentTypeOption {
  id: number;
  label: string;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map!: L.Map;

 
  eventRecords: EventRecord[] = [];
  filteredRecords: EventRecord[] = [];


  eventTypes: EventType[] = [];
  incidentTypeOptions: IncidentTypeOption[] = [];

  selectedTypeIds: number[] = [];


  statusOptions: string[] = ['Resolved', 'Unresolved', 'Acknowledged', 'Unacknowledged'];
  selectedStatus: string[] = [];

  
  allGasTypes: string[] = [];
  selectedGasTypes: Record<string, boolean> = {};

  dateFrom: string | null = null;
  dateTo: string | null = null;


  assignedUserSearch: string = '';
  deviceIdSearch: number | null = null;


  private customIcon = L.icon({
    iconUrl:
      'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-black.png',
    shadowUrl:
      'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  constructor(private mapDataService: MapDataService) {}

  ngAfterViewInit(): void {
    this.initMap();
    this.fetchDataFromJson();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }


  private initMap(): void {
    this.map = L.map('leaflet-map', {
      center: [20, 0],
      zoom: 2.5,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      noWrap: true
    }).addTo(this.map);

    const corner1 = L.latLng(-85, -180);
    const corner2 = L.latLng(85, 180);
    const bounds = L.latLngBounds(corner1, corner2);
    this.map.setMaxBounds(bounds);

    this.map.on('drag', () => {
      this.map.panInsideBounds(bounds, { animate: false });
    });
  }


  private fetchDataFromJson(): void {
    this.mapDataService.getAllEvents().subscribe({
      next: (res) => {

        this.eventRecords = res.events || [];
        this.filteredRecords = [...this.eventRecords];

        this.eventTypes = res.eventTypes || [];
        this.incidentTypeOptions = this.eventTypes.map(et => {
          let label = et.name;
          if (et.name === 'fall_detected_alert') label = 'Fall Incidents';
          else if (et.name === 'silent_alert') label = 'Silent Alert';
          else if (et.name === 'emergency_alert') label = 'Emergency Alert';
          return { id: et.id, label };
        });

        if (res.gasTypes) {
          this.allGasTypes = res.gasTypes;
          this.selectedGasTypes = {};
          this.allGasTypes.forEach(g => this.selectedGasTypes[g] = false);
        }

        this.updateMapMarkers();
      },
      error: (err) => {
        console.error('Failed to load JSON:', err);
      },
    });
  }

  private updateMapMarkers(): void {
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        layer.remove();
      }
    });

    this.filteredRecords.forEach(evt => {
      if (evt.lat != null && evt.lng != null) {
        L.marker([evt.lat, evt.lng], {
          icon: this.customIcon,
          title: evt.name
        })
          .bindPopup(`<b>${evt.name}</b>`)
          .addTo(this.map);
      }
    });
  }


  toggleIncidentType(typeId: number) {
    const idx = this.selectedTypeIds.indexOf(typeId);
    if (idx === -1) {
      this.selectedTypeIds.push(typeId);
    } else {
      this.selectedTypeIds.splice(idx, 1);
    }
  }


  toggleStatus(status: string) {
    const idx = this.selectedStatus.indexOf(status);
    if (idx === -1) {
      this.selectedStatus.push(status);
    } else {
      this.selectedStatus.splice(idx, 1);
    }
  }


  toggleSelectAllGas() {
    const hasUnchecked = Object.keys(this.selectedGasTypes)
      .some(g => !this.selectedGasTypes[g]);

    Object.keys(this.selectedGasTypes).forEach(g => {
      this.selectedGasTypes[g] = hasUnchecked;
    });
  }

  applyFilters() {
    let filtered = [...this.eventRecords];

    if (this.selectedTypeIds.length > 0) {
      filtered = filtered.filter(e =>
        this.selectedTypeIds.includes(e.device_event_type_id)
      );
    }

    filtered = filtered.filter(e => {
      const statusTags: string[] = [];

      if (e.current_status === 'resolved') {
        statusTags.push('Resolved');
      } else {
        statusTags.push('Unresolved');
      }

      if (e.date_acknowledged) {
        statusTags.push('Acknowledged');
      } else {
        statusTags.push('Unacknowledged');
      }

      if (this.selectedStatus.length === 0) {
        return true;
      } else {
        return this.selectedStatus.some(st => statusTags.includes(st));
      }
    });


    const chosenGases = Object.keys(this.selectedGasTypes)
      .filter(g => this.selectedGasTypes[g]);
    if (chosenGases.length > 0) {
      filtered = filtered.filter(e => e.gas_type && chosenGases.includes(e.gas_type));
    }


    if (this.dateFrom) {
      const fromTime = new Date(this.dateFrom).getTime();
      filtered = filtered.filter(e => new Date(e.date_created).getTime() >= fromTime);
    }
    if (this.dateTo) {
      const toTime = new Date(this.dateTo).getTime();
      filtered = filtered.filter(e => new Date(e.date_created).getTime() <= toTime);
    }


    if (this.assignedUserSearch.trim()) {
      const keyword = this.assignedUserSearch.toLowerCase();
      filtered = filtered.filter(e =>
        e.assigned_user && e.assigned_user.toLowerCase().includes(keyword)
      );
    }

    if (this.deviceIdSearch != null && !isNaN(this.deviceIdSearch)) {
      filtered = filtered.filter(e => e.device_id === this.deviceIdSearch);
    }

    this.filteredRecords = filtered;
    this.updateMapMarkers();
  }
}
