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
  selectedTypeId: number | null = null;


  statusOptions: string[] = ['All', 'Resolved', 'Unresolved'];
  selectedStatus: string = 'All';


  allGasTypes: string[] = [];         
  selectedGasTypes: Record<string, boolean> = {}; 


  dateFrom: string | null = null;
  dateTo: string | null = null;

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

  fetchDataFromJson(): void {
    this.mapDataService.getAllEvents().subscribe({
      next: (res) => {
        this.eventRecords = res.events || [];
        this.filteredRecords = [...this.eventRecords];
        this.eventTypes = res.eventTypes || [];
        this.incidentTypeOptions = this.eventTypes.map(et => {
          let label = et.name;
          if (et.name === 'fall_detected_alert') label = 'Fall Incidents';
          else if (et.name === 'silent_alert')    label = 'Silent Alert';
          else if (et.name === 'emergency_alert') label = 'Emergency Alert';
          return {
            id: et.id,
            label
          };
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


  private addMarker(lat: number, lng: number, label: string) {
    L.marker([lat, lng], {
      icon: this.customIcon,
      title: label
    })
      .bindPopup(`<b>${label}</b>`)
      .addTo(this.map);
  }

  private updateMapMarkers(): void {

    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        layer.remove();
      }
    });


    this.filteredRecords.forEach(evt => {
      this.addMarker(evt.lat, evt.lng, evt.name);
    });
  }


  selectIncidentType(typeId: number | null) {
    this.selectedTypeId = typeId;
  }

  setStatus(s: string) {
    this.selectedStatus = s;
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


    if (this.selectedTypeId) {
      filtered = filtered.filter(e => e.device_event_type_id === this.selectedTypeId);
    }

    if (this.selectedStatus !== 'All') {
      if (this.selectedStatus === 'Resolved') {
        filtered = filtered.filter(e => e.current_status === 'resolved');
      } else {

        filtered = filtered.filter(e => e.current_status !== 'resolved');
      }
    }


    const chosenGases = Object.keys(this.selectedGasTypes)
      .filter(g => this.selectedGasTypes[g]);
    if (chosenGases.length > 0) {
      filtered = filtered.filter(e => chosenGases.includes(e.gas_type));
    }


    if (this.dateFrom) {
      const fromTime = new Date(this.dateFrom).getTime();
      filtered = filtered.filter(e => new Date(e.date_created).getTime() >= fromTime);
    }
    if (this.dateTo) {
      const toTime = new Date(this.dateTo).getTime();
      filtered = filtered.filter(e => new Date(e.date_created).getTime() <= toTime);
    }


    this.filteredRecords = filtered;

    this.updateMapMarkers();
  }
}
