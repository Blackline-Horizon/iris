import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as L from 'leaflet';
import { EventRecord } from '../map/map-data.service';

@Component({
  selector: 'app-dashboard-map',
  standalone: true,
  templateUrl: './dashboard-map.component.html',
  styleUrls: ['./dashboard-map.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardMapComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {

  @Input() events: EventRecord[] = [];

  @ViewChild('mapContainer', { static: true }) mapContainerRef!: ElementRef;
  private map!: L.Map;

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

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
    this.renderMarkers();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events']) {
      if (this.map) {
        this.renderMarkers();
      }
    }
  }

  private initMap(): void {
    this.map = L.map(this.mapContainerRef.nativeElement, {
      center: [20, 0],
      zoom: 2.5,
      zoomControl: true,
      attributionControl: false
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

  private renderMarkers(): void {
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        layer.remove();
      }
    });


    this.events.forEach((evt) => {
      if (evt.lat != null && evt.lng != null) {
        L.marker([evt.lat, evt.lng], {
          icon: this.customIcon
        })
          .bindPopup(`<b>${evt.name}</b>`)
          .addTo(this.map);
      }
    });
  }
}
