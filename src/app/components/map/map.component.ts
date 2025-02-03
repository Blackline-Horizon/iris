import { Component } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';


@Component({
  selector: 'app-map',
  standalone: true,
  imports: [GoogleMapsModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent {
  
  options: google.maps.MapOptions = {
    mapId: "2b000ff322849d05",
    center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
    zoom: 12,
  };

  markers = [
    { lat: 37.7749, lng: -122.4194 }, // San Francisco
    { lat: 34.0522, lng: -118.2437 }  // Los Angeles
  ];
}