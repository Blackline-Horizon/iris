// src/app/components/map/map.component.ts
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, HostListener, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import 'leaflet.markercluster';
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
  private markers: L.CircleMarker[] = [];
  private markerLayer: any; // MarkerClusterGroup
  private mapInitialized: boolean = false;
  private mapUpdateTimer: any = null;
  
  // Data properties
  alerts: EventRecord[] = [];
  filterOptions: FilterOptions | null = null;
  displayedSensorTypes: string[] = [];
  
  // UI state
  isFilterPanelOpen: boolean = false;
  isLoading: boolean = true;
  isLoadingMarkers: boolean = false;
  loadingProgress: number = 0;
  error: string | null = null;
  markersDisplayed: number = 0;
  totalAlertsWithLocation: number = 0;
  usingClusters: boolean = true;
  
  // Filter state
  appliedFilters: any = {
    sensorTypes: [],
    industries: [],
    countries: [],
    continents: [],
    startDate: '',
    endDate: ''
  };
  
  // Metrics
  totalAlerts: number = 0;
  uniqueLocations: number = 0;
  uniqueCountries: number = 0;
  
  // Marker colors for different sensor types
  private sensorTypeColors: Record<string, string> = {
    'H2S': '#e74c3c',          // Red
    'LEL-MPS': '#3498db',      // Blue
    'O2': '#2ecc71',           // Green
    'NH3': '#f39c12',          // Orange
    'LEL': '#9b59b6',          // Purple
    'O3': '#1abc9c',           // Teal
    'HCN': '#f1c40f',          // Yellow
    'Cl2': '#e67e22',          // Dark Orange
    'CO': '#34495e',           // Dark Blue
    'ClO2': '#16a085',         // Green Blue
    'PID': '#d35400',          // Burnt Orange
    'HF': '#8e44ad',           // Purple
    'NO2': '#2980b9',          // Dark Blue
    'Gamma': '#c0392b',        // Dark Red
    'CO2': '#27ae60',          // Dark Green
    'SO2': '#7f8c8d',          // Gray
    'default': '#95a5a6'       // Light Gray (default)
  };
  
  constructor(
    private mapDataService: MapDataService,
    private ngZone: NgZone
  ) {
    console.log('MapComponent constructed');
  }
  
  ngOnInit(): void {
    console.log('MapComponent initialized');
    
    // Set default date range - last 14 days
    const today = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 14);
    
    this.appliedFilters.endDate = this.formatDate(today);
    this.appliedFilters.startDate = this.formatDate(fourteenDaysAgo);
    
    console.log('Default date range set:', this.appliedFilters.startDate, 'to', this.appliedFilters.endDate);
    
    // Initialize map before loading data
    this.initMap();
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  ngAfterViewInit(): void {
    console.log('MapComponent afterViewInit');
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 300);
  }
  
  ngOnDestroy(): void {
    console.log('MapComponent being destroyed');
    if (this.mapUpdateTimer) {
      clearTimeout(this.mapUpdateTimer);
    }
    if (this.map) {
      this.map.remove();
    }
  }
  
  /**
   * Initialize the Leaflet map
   */
  private initMap(): void {
    console.log('Initializing map...');
    
    try {
      // Ensure map initialization runs outside Angular zone for better performance
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          const mapDiv = document.getElementById('map');
          if (!mapDiv) {
            console.error('Map container element not found!');
            this.ngZone.run(() => {
              this.error = 'Map container not found. Please refresh the page.';
              this.isLoading = false;
            });
            return;
          }
          
          console.log('Map container found, creating map instance');
          
          // Ensure map container has width and height
          if (mapDiv.clientHeight === 0 || mapDiv.clientWidth === 0) {
            console.warn('Map container has zero height or width!');
            mapDiv.style.height = '500px';
            mapDiv.style.width = '100%';
          }
          
          // Create map instance with improved settings
          this.map = L.map('map', {
            center: [20, 0],
            zoom: 2,
            preferCanvas: true,     // Use Canvas rendering for better performance
            wheelDebounceTime: 150, // Debounce time for wheel events
            zoomSnap: 0.5,          // Smooth zooming
            zoomDelta: 0.5,         // Smooth zoom steps
            markerZoomAnimation: true
          });
          
          // Add tile layer (dark theme to match dashboard)
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: 'abcd',
            maxZoom: 19
          }).addTo(this.map);
          
          // Initialize marker cluster layer
          this.markerLayer = L.markerClusterGroup({
            disableClusteringAtZoom: 13,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            chunkedLoading: true,
            zoomToBoundsOnClick: true,
            showCoverageOnHover: false,
            animate: true
          }).addTo(this.map);
          
          // Update markers when map movement ends
          this.map.on('moveend', () => {
            if (this.mapUpdateTimer) {
              clearTimeout(this.mapUpdateTimer);
            }
            
            this.mapUpdateTimer = setTimeout(() => {
              this.updateMapMarkers();
            }, 300); // 300ms delay
          });
          
          this.mapInitialized = true;
          console.log('Map initialized successfully');
          
          // Fix map rendering - must set state inside Angular zone
          this.ngZone.run(() => {
            setTimeout(() => {
              console.log('Invalidating map size');
              this.map.invalidateSize();
              // Now load data
              this.loadData();
            }, 500);
          });
        }, 300); // Small delay to ensure DOM is ready
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      this.error = 'Failed to initialize map: ' + (error instanceof Error ? error.message : String(error));
      this.isLoading = false;
    }
  }
  
  /**
   * Load alert data from the API
   */
  loadData(): void {
    console.log('Loading map data...');
    this.isLoading = true;
    this.error = null;
    
    const apiFilters = {
      sensorTypes: this.appliedFilters.sensorTypes,
      industries: this.appliedFilters.industries,
      countries: this.appliedFilters.countries,
      continents: this.appliedFilters.continents,
      startDate: this.appliedFilters.startDate || undefined,
      endDate: this.appliedFilters.endDate || undefined
    };
    
    console.log('Requesting data with filters:', apiFilters);
    
    // Ensure map is initialized before loading data
    if (!this.mapInitialized) {
      console.warn('Map not initialized yet, initializing now');
      this.initMap();
      return;
    }
    
    this.mapDataService.getMapData(apiFilters).subscribe({
      next: (response) => {
        console.log('Received response with', response.alerts?.length || 0, 'alerts');
        
        this.alerts = response.alerts || [];
        this.totalAlerts = response.metrics?.total_alerts || 0;
        
        // Create filter options from distinct values if not already available
        if (!this.filterOptions && this.alerts.length > 0) {
          this.initializeFilterOptions(this.alerts);
        }
        
        // Process map markers
        this.updateMapMarkers();
        
        // Calculate metrics
        this.calculateMetrics();
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load alerts:', err);
        this.error = 'Failed to load map data: ' + (err.message || 'Unknown error');
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Initialize filter options from alert data
   */
  initializeFilterOptions(alerts: EventRecord[]): void {
    console.log('Initializing filter options');
    // Extract unique values for each filter from the alerts
    const sensorTypes = [...new Set(alerts.map(alert => alert.sensor_type))].filter(Boolean);
    const industries = [...new Set(alerts.map(alert => alert.industry))].filter(Boolean);
    
    // Group countries by continent
    const allCountries = [...new Set(alerts.map(alert => alert.country))].filter(Boolean) as string[];
    
    // Simplified continent mapping
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
    
    console.log('Filter options initialized:', 
      this.filterOptions.sensorTypes.length, 'sensor types,',
      this.filterOptions.industries.length, 'industries,',
      Object.keys(this.filterOptions.countries).length, 'continent groups');
  }
  
  /**
   * Update map markers based on the filtered alerts - show all markers
   */
  updateMapMarkers(): void {
    console.log('Updating map markers');
    
    if (!this.mapInitialized || !this.map) {
      console.error('Cannot update markers: Map not initialized');
      return;
    }
    
    // Execute marker update outside Angular zone for better performance
    this.ngZone.runOutsideAngular(() => {
      this.isLoadingMarkers = true;
      this.loadingProgress = 0;
      
      // Clear existing markers
      this.markerLayer.clearLayers();
      this.markers = [];
      
      // Get current view bounds
      const bounds = this.map.getBounds();
      
      // Track displayed sensor types for the legend
      this.displayedSensorTypes = [];
      
      // Add new markers for each alert with location data
      const alertsWithLocation = this.alerts.filter(alert => 
        alert.latitude !== undefined && 
        alert.latitude !== null && 
        alert.longitude !== undefined && 
        alert.longitude !== null
      );
      
      this.ngZone.run(() => {
        this.totalAlertsWithLocation = alertsWithLocation.length;
      });
      
      console.log(`Found ${alertsWithLocation.length} alerts with valid location data`);
      
      // Show all markers - no limit
      const markersToShow = alertsWithLocation;
      
      this.ngZone.run(() => {
        this.markersDisplayed = markersToShow.length;
      });
      
      // Process markers in batches for better performance
      const batchSize = 100;
      const processBatch = (startIndex: number) => {
        const endIndex = Math.min(startIndex + batchSize, markersToShow.length);
        const batch = markersToShow.slice(startIndex, endIndex);
        
        const newMarkers: L.CircleMarker[] = [];
        
        batch.forEach(alert => {
          // Get color based on sensor type
          const sensorType = alert.sensor_type || 'default';
          const color = this.getMarkerColor(sensorType);
          
          // Add sensor type to displayedSensorTypes array for legend
          if (!this.displayedSensorTypes.includes(sensorType)) {
            this.displayedSensorTypes.push(sensorType);
          }
          
          // Create lightweight marker
          const marker = this.createLightweightMarker(alert);
          newMarkers.push(marker);
        });
        
        // Add batch of markers at once
        this.markerLayer.addLayers(newMarkers);
        this.markers = this.markers.concat(newMarkers);
        
        // Update progress
        const progress = Math.round((endIndex / markersToShow.length) * 100);
        this.ngZone.run(() => {
          this.loadingProgress = progress;
        });
        
        // If there are more batches, continue processing
        if (endIndex < markersToShow.length) {
          setTimeout(() => processBatch(endIndex), 10);
        } else {
          // All batches processed
          console.log(`Added ${this.markers.length} markers to the map`);
          
          // Update UI state inside Angular zone
          this.ngZone.run(() => {
            this.isLoadingMarkers = false;
            
            // Fit map to markers if there are any
            if (this.markers.length > 0 && !this.mapWasMoved) {
              try {
                const group = L.featureGroup(this.markers);
                this.map.fitBounds(group.getBounds(), { 
                  padding: [30, 30],
                  maxZoom: 10
                });
                console.log('Map fitted to marker bounds');
              } catch (error) {
                console.error('Error fitting map to bounds:', error);
              }
            }
          });
          
          // Fix map rendering
          setTimeout(() => {
            if (this.map) {
              this.map.invalidateSize();
              console.log('Map size invalidated after marker update');
            }
          }, 300);
        }
      };
      
      // Track if map has been moved
      this.mapWasMoved = this.map.getCenter().lat !== 20 || this.map.getCenter().lng !== 0;
      
      // Start first batch
      if (markersToShow.length > 0) {
        processBatch(0);
      } else {
        this.ngZone.run(() => {
          this.isLoadingMarkers = false;
        });
        console.log('No markers to display');
      }
    });
  }
  
  /**
   * Create lightweight circle marker for better performance
   */
  private createLightweightMarker(alert: EventRecord): L.CircleMarker {
    const sensorType = alert.sensor_type || 'default';
    const color = this.getMarkerColor(sensorType);
    
    const marker = L.circleMarker(
      [alert.latitude as number, alert.longitude as number], 
      {
        radius: 6,             // Radius
        fillColor: color,      // Fill color
        color: '#fff',         // Border color
        weight: 1,             // Border width
        opacity: 1,            // Opacity
        fillOpacity: 0.7       // Fill opacity
      }
    );
    
    // Create popup content
    const popupContent = `
      <div style="padding: 6px;">
        <div style="font-weight: bold; margin-bottom: 6px;">${alert.sensor_type || 'Unknown Sensor'}</div>
        <div>Industry: ${alert.industry || 'N/A'}</div>
        <div>Country: ${alert.country || 'N/A'}</div>
        <div>Date: ${new Date(alert.date_created).toLocaleString()}</div>
      </div>
    `;
    
    // Add popup
    marker.bindPopup(popupContent);
    
    return marker;
  }
  
  /**
   * Calculate metrics for the map
   */
  calculateMetrics(): void {
    console.log('Calculating map metrics');
    
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
    
    console.log('Metrics calculated:', 
      this.totalAlertsWithLocation, 'alerts with location,',
      this.uniqueLocations, 'unique locations,',
      this.uniqueCountries, 'unique countries');
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
    console.log('Applying filters:', filters);
    this.appliedFilters = { ...filters };
    this.loadData();
    this.isFilterPanelOpen = false;
  }
  
  /**
   * Reset filters to default values
   */
  resetFilters(): void {
    console.log('Resetting filters');
    // Reset to default filters, with 14-day time range instead of 12 hours
    const today = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 14);
    
    this.appliedFilters = {
      sensorTypes: [],
      industries: [],
      countries: [],
      continents: [],
      startDate: this.formatDate(fourteenDaysAgo),
      endDate: this.formatDate(today)
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
    
    // Date filters also count
    if (this.appliedFilters.startDate) count++;
    if (this.appliedFilters.endDate) count++;
    
    return count;
  }
  
  /**
   * Get date range text for display
   */
  getDateRangeText(): string {
    if (!this.appliedFilters.startDate || !this.appliedFilters.endDate) {
      return 'All time';
    }

    const startDate = new Date(this.appliedFilters.startDate);
    const endDate = new Date(this.appliedFilters.endDate);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }
  
  /**
   * Force map to refresh
   */
  refreshMap(): void {
    console.log('Forcing map refresh');
    if (this.map) {
      setTimeout(() => {
        this.map.invalidateSize();
      }, 200);
    }
  }
  
  /**
   * Handle window resize for responsive design
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.refreshMap();
    
    if (window.innerWidth > 768 && window.innerWidth <= 992) {
      this.isFilterPanelOpen = false; // Auto-collapse on medium screens
    }
  }
  
  // Track if map has been moved
  private mapWasMoved: boolean = false;
}