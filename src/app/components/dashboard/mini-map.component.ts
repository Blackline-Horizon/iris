import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewEncapsulation,
  ElementRef,
  ViewChild
} from '@angular/core';
import * as L from 'leaflet';
import { EventRecord } from '../map/map-data.service';

@Component({
  selector: 'app-mini-map',
  standalone: true,
  templateUrl: './mini-map.component.html',
  styleUrls: ['./mini-map.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MiniMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() events: EventRecord[] = [];
  @ViewChild('miniMapContainer', { static: true }) mapContainer!: ElementRef;

  private map!: L.Map;

  private customIcon = L.icon({
    iconUrl:
      'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png',
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

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.map);


    const corner1 = L.latLng(-85, -180);
    const corner2 = L.latLng(85, 180);
    this.map.setMaxBounds(L.latLngBounds(corner1, corner2));
  }

  private renderMarkers(): void {
    this.events.forEach(evt => {
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
