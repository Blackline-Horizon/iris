import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { MapDataService } from './map-data.service';
import { DashboardFiltersComponent } from '../dashboard/dashboard-filters/dashboard-filters.component';
import { MetricCardComponent } from '../dashboard/metric-card/metric-card.component';
import { EventRecord, FilterOptions } from '../dashboard/dashboard-data.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DashboardFiltersComponent,
    MetricCardComponent
  ],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  // Map properties
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private markerLayer!: L.LayerGroup;
  
  // Data properties
  alerts: EventRecord[] = [];
  filterOptions: FilterOptions | null = null;
  displayedSensorTypes: string[] = [];
  
  // Filter state
  appliedFilters: any = {
    sensorTypes: [],
    industries: [],
    countries: [],
    continents: []
  };
  
  // UI state
  isFilterPanelOpen: boolean = false;
  isLoading: boolean = true;
  error: string | null = null;
  
  // Metrics
  totalAlerts: number = 0;
  totalAlertsWithLocation: number = 0;
  uniqueLocations: number = 0;
  uniqueCountries: number = 0;
  
  // Marker colors for different sensor types
  private sensorTypeColors: Record<string, string> = {
    'temperature_sensor': '#e74c3c',   // Red
    'humidity_sensor': '#3498db',      // Blue
    'pressure_sensor': '#2ecc71',      // Green
    'gas_sensor': '#f39c12',           // Orange
    'motion_sensor': '#9b59b6',        // Purple
    'proximity_sensor': '#1abc9c',     // Teal
    'light_sensor': '#f1c40f',         // Yellow
    'sound_sensor': '#e67e22',         // Dark Orange
    'vibration_sensor': '#34495e',     // Dark Blue
    'default': '#95a5a6'               // Gray (default)
  };
  
  constructor(private mapDataService: MapDataService) {}
  
  ngOnInit(): void {
    this.loadData();
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 100);
  }
  
  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
  
  /**
   * Initialize the Leaflet map
   */
  private initMap(): void {
    // Create map instance
    this.map = L.map('map', {
      center: [20, 0],
      zoom: 2,
      maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
      maxBoundsViscosity: 1.0,
      minZoom: 2
    });
    
    // Add tile layer (dark theme to match dashboard)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);
    
    // Add empty marker layer to be populated later
    this.markerLayer = L.layerGroup().addTo(this.map);
    
    // Fix map not rendering properly in hidden divs
    setTimeout(() => {
      this.map.invalidateSize();
    }, 300);
  }
  
  /**
   * Load alert data from the API
   */
  loadData(): void {
    this.isLoading = true;
    this.error = null;
    
    const apiFilters = {
      sensorTypes: this.appliedFilters.sensorTypes,
      industries: this.appliedFilters.industries,
      countries: this.appliedFilters.countries,
      continents: this.appliedFilters.continents
    };
    
    this.mapDataService.getMapData(apiFilters).subscribe({
      next: (response) => {
        this.alerts = response.alerts;
        this.totalAlerts = response.metrics.total_alerts;
        
        // Create filter options from distinct values if not already available
        if (!this.filterOptions) {
          this.initializeFilterOptions(response.alerts);
        }
        
        // Process map markers
        this.updateMapMarkers();
        
        // Calculate metrics
        this.calculateMetrics();
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load alerts:', err);
        this.error = 'Failed to load map data. Please try again later.';
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Initialize filter options from alert data
   */
  initializeFilterOptions(alerts: EventRecord[]): void {
    // Extract unique values for each filter from the alerts
    const sensorTypes = [...new Set(alerts.map(alert => alert.sensor_type))].filter(Boolean);
    const industries = [...new Set(alerts.map(alert => alert.industry))].filter(Boolean);
    
    // Group countries by continent (simplified example)
    const allCountries = [...new Set(alerts.map(alert => alert.country))].filter(Boolean) as string[];
    
    // Simplified continent mapping - you may want to replace with actual continent data
    const euCountries = allCountries.filter(country => 
      ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 
       'Poland', 'Sweden', 'Austria', 'Denmark', 'Finland', 'Ireland', 'Portugal', 'Greece'].includes(country)
    );
    
    const naCountries = allCountries.filter(country => 
      ['United States', 'Canada', 'Mexico'].includes(country)
    );
    
    const otherCountries = allCountries.filter(country => 
      !euCountries.includes(country) && !naCountries.includes(country)
    );
    
    this.filterOptions = {
      sensorTypes: sensorTypes.sort(),
      industries: industries.sort(),
      eventTypes: [],
      resolutionReasons: [],
      deviceTypes: [],
      countries: {
        'EU': euCountries.sort(),
        'North America': naCountries.sort(),
        'Other': otherCountries.sort()
      }
    };
  }
  
  /**
   * Update map markers based on the filtered alerts
   */
  updateMapMarkers(): void {
    // Clear existing markers
    this.markerLayer.clearLayers();
    this.markers = [];
    
    // Track displayed sensor types for the legend
    this.displayedSensorTypes = [];
    
    // Add new markers for each alert with location data
    const alertsWithLocation = this.alerts.filter(alert => 
      alert.latitude !== undefined && 
      alert.latitude !== null && 
      alert.longitude !== undefined && 
      alert.longitude !== null
    );
    
    this.totalAlertsWithLocation = alertsWithLocation.length;
    
    // Create markers
    alertsWithLocation.forEach(alert => {
      // Get color based on sensor type
      const sensorType = alert.sensor_type || 'default';
      const color = this.getMarkerColor(sensorType);
      
      // Add sensor type to displayedSensorTypes array for legend
      if (!this.displayedSensorTypes.includes(sensorType)) {
        this.displayedSensorTypes.push(sensorType);
      }
      
      // Create custom icon
      const customIcon = this.createCustomIcon(color);
      
      // Create marker
      const marker = L.marker([alert.latitude as number, alert.longitude as number], {
        icon: customIcon,
        title: alert.sensor_type || 'Unknown'
      });
      
      // Create popup content
      const popupContent = `
        <div style="padding: 6px;">
          <div style="font-weight: bold; margin-bottom: 6px;">${alert.sensor_type || 'Unknown Sensor'}</div>
          <div>Industry: ${alert.industry || 'N/A'}</div>
          <div>Country: ${alert.country || 'N/A'}</div>
          <div>Date: ${new Date(alert.date_created).toLocaleString()}</div>
        </div>
      `;
      
      // Add popup to marker
      marker.bindPopup(popupContent);
      
      // Add marker to map
      marker.addTo(this.markerLayer);
      this.markers.push(marker);
    });
    
    // Fit map to markers if there are any
    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds(), { 
        padding: [30, 30],
        maxZoom: 12
      });
    }
    
    // Fix map rendering
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }
  
  /**
   * Create a custom icon with specified color
   */
  private createCustomIcon(color: string): L.DivIcon {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.4 0 0 5.4 0 12C0 20.4 12 36 12 36C12 36 24 20.4 24 12C24 5.4 18.6 0 12 0Z" fill="${color}"/>
          <circle cx="12" cy="12" r="6" fill="white" fill-opacity="0.4"/>
        </svg>
      `,
      iconSize: [24, 36],
      iconAnchor: [12, 36],
      popupAnchor: [0, -36]
    });
  }
  
  /**
   * Calculate metrics for the map
   */
  calculateMetrics(): void {
    // Count alerts with location data
    const alertsWithLocation = this.alerts.filter(alert => 
      alert.latitude !== undefined && 
      alert.latitude !== null && 
      alert.longitude !== undefined && 
      alert.longitude !== null
    );
    
    this.totalAlertsWithLocation = alertsWithLocation.length;
    
    // Count unique locations (based on lat/lng pairs)
    const uniqueLocations = new Set<string>();
    alertsWithLocation.forEach(alert => {
      uniqueLocations.add(`${alert.latitude},${alert.longitude}`);
    });
    this.uniqueLocations = uniqueLocations.size;
    
    // Count unique countries
    const uniqueCountries = new Set<string>();
    this.alerts.forEach(alert => {
      if (alert.country) {
        uniqueCountries.add(alert.country);
      }
    });
    this.uniqueCountries = uniqueCountries.size;
  }
  
  /**
   * Get marker color based on sensor type
   */
  getMarkerColor(sensorType: string): string {
    return this.sensorTypeColors[sensorType] || this.sensorTypeColors['default'];
  }
  
  /**
   * Format sensor type for display (convert snake_case to Title Case)
   */
  formatSensorType(sensorType: string): string {
    return sensorType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Toggle filter panel visibility
   */
  toggleFilterPanel(): void {
    this.isFilterPanelOpen = !this.isFilterPanelOpen;
  }
  
  /**
   * Update filters without applying them
   */
  updateFilters(filters: any): void {
    this.appliedFilters = { ...filters };
  }
  
  /**
   * Apply filters and reload data
   */
  applyFilters(filters: any): void {
    this.appliedFilters = { ...filters };
    this.loadData();
    this.isFilterPanelOpen = false;
  }
  
  /**
   * Reset filters to default values
   */
  resetFilters(): void {
    this.appliedFilters = {
      sensorTypes: [],
      industries: [],
      countries: [],
      continents: []
    };
    
    this.loadData();
  }
  
  /**
   * Check if there are any active filters
   */
  hasActiveFilters(): boolean {
    return Object.keys(this.appliedFilters).some(key => {
      if (Array.isArray(this.appliedFilters[key])) {
        return this.appliedFilters[key].length > 0;
      }
      return !!this.appliedFilters[key];
    });
  }
  
  /**
   * Get count of active filters
   */
  getActiveFiltersCount(): number {
    let count = 0;
    
    // Count array filters
    ['sensorTypes', 'industries', 'countries', 'continents'].forEach(key => {
      if (this.appliedFilters[key] && this.appliedFilters[key].length > 0) {
        count++;
      }
    });
    
    return count;
  }
  
  /**
   * Handle window resize for responsive design
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    if (this.map) {
      this.map.invalidateSize();
    }
    
    if (window.innerWidth > 768 && window.innerWidth <= 992) {
      this.isFilterPanelOpen = false; // Auto-collapse on medium screens
    }
  }
}