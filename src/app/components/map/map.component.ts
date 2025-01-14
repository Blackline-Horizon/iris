import {
  AfterViewInit,
  Component,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import 'leaflet.heat';

interface MarkerData {
  lat: number;
  lng: number;
  label: string;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map.component.html',
  encapsulation: ViewEncapsulation.None, 
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map!: L.Map;

  // Heatmap
  private heatLayer?: any;
  heatOn = true;
  heatRadius = 25; 


  alertType = '';
  dateFrom: string | null = null;
  dateTo: string | null = null;


  markers: MarkerData[] = [];


  private readonly DEFAULT_LAT = 37.7749;
  private readonly DEFAULT_LNG = -122.4194;
  private readonly DEFAULT_ZOOM = 5;


  private initPoints: MarkerData[] = [
    { lat: 37.7749, lng: -122.4194, label: 'San Francisco' },
    { lat: 34.0522, lng: -118.2437, label: 'Los Angeles' },
    { lat: 36.1699, lng: -115.1398, label: 'Las Vegas' },
    { lat: 40.7128, lng: -74.0060,  label: 'New York' },
    { lat: 41.8781, lng: -87.6298,  label: 'Chicago' },
  ];


  private customIcon = L.icon({
    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png',
    shadowUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  ngAfterViewInit() {
    this.initMap();

    this.initPoints.forEach((p) => this.addMarker(p));
    this.setupHeatmap(this.initPoints);
  }

  private initMap() {
    this.map = L.map('leaflet-map', {
      center: [this.DEFAULT_LAT, this.DEFAULT_LNG],
      zoom: this.DEFAULT_ZOOM,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap Contributors',
    }).addTo(this.map);
  }


  private setupHeatmap(points: MarkerData[]) {
    const heatPoints = points.map((p) => [p.lat, p.lng, 0.6]);
    // @ts-ignore
    this.heatLayer = (L as any).heatLayer(heatPoints, {
      radius: this.heatRadius,
      blur: 15,
      maxZoom: 17,
    });
    this.heatLayer.addTo(this.map);


    this.markers.push(...points);
  }

  toggleHeatmap() {
    this.heatOn = !this.heatOn;
    if (this.heatOn) {
      this.heatLayer?.addTo(this.map);
    } else {
      this.map.removeLayer(this.heatLayer);
    }
  }

  updateHeatmapRadius() {
    if (this.heatLayer) {
      this.heatLayer.setOptions({ radius: this.heatRadius });
    }
  }

  simulateAlertMarker() {
    const lat = 30 + Math.random() * 20;  
    const lng = -120 + Math.random() * 25; 
    const label = 'Simulated Alert';
    const m: MarkerData = { lat, lng, label };

    this.addMarker(m);
    this.heatLayer?.addLatLng([lat, lng, 0.6]);
  }

  fitBounds() {
    if (this.markers.length === 0) return;
    const bounds = L.latLngBounds(this.markers.map(m => [m.lat, m.lng]));
    this.map.fitBounds(bounds, { padding: [20, 20] });
  }

  applyFilters() {
    alert(`Applying filters:\nType=${this.alertType}, From=${this.dateFrom}, To=${this.dateTo}`);
  }

  private addMarker(m: MarkerData) {
    L.marker([m.lat, m.lng], {
      icon: this.customIcon,
      title: m.label,
    })
    .bindPopup(`<b>${m.label}</b>`)
    .addTo(this.map);

    this.markers.push(m);
  }

  removeMarker(index: number) {

    this.markers.splice(index, 1);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}
