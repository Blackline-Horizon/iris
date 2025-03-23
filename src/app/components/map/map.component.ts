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
  private openPopup: L.Popup | null = null; // Track current open popup
  
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
  
  // Marker colors for different sensor types - updated with more vibrant colors
  private sensorTypeColors: Record<string, string> = {
    'H2S': '#FF5252',          // Bright Red
    'LEL-MPS': '#448AFF',      // Bright Blue
    'O2': '#4CAF50',           // Bright Green
    'NH3': '#FF9800',          // Bright Orange
    'LEL': '#9C27B0',          // Bright Purple
    'O3': '#00BCD4',           // Bright Teal
    'HCN': '#FFEB3B',          // Bright Yellow
    'Cl2': '#FF6E40',          // Bright Orange-Red
    'CO': '#3F51B5',           // Indigo
    'ClO2': '#009688',         // Teal
    'PID': '#FF5722',          // Deep Orange
    'HF': '#673AB7',           // Deep Purple
    'NO2': '#2196F3',          // Bright Blue
    'Gamma': '#E53935',        // Red
    'CO2': '#4CAF50',          // Green
    'SO2': '#607D8B',          // Blue Grey
    'default': '#9E9E9E'       // Medium Grey (default)
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
   * Initialize the Leaflet map with improved settings for stability
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
          
          // IMPROVED: Create map instance with better performance settings
          this.map = L.map('map', {
            center: [20, 0],
            zoom: 2,
            preferCanvas: true,       // Use Canvas rendering for better performance
            wheelDebounceTime: 150,   // Debounce time for wheel events
            zoomSnap: 0.5,            // Smooth zooming
            zoomDelta: 0.5,           // Smooth zoom steps
            markerZoomAnimation: true,
            zoomAnimation: true,      // Enable zoom animations for smoother experience
            fadeAnimation: false,     // Disable fade animations that can cause jitter
            inertia: true,            // Enable inertia for smoother panning
            worldCopyJump: true       // Smooth wrapping at the 180th meridian
          });
          
          // Add tile layer (dark theme to match dashboard)
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: 'abcd',
            maxZoom: 19
          }).addTo(this.map);
          
          // IMPROVED: Initialize marker cluster layer with enhanced settings for stability
          this.markerLayer = L.markerClusterGroup({
            disableClusteringAtZoom: 13,
            maxClusterRadius: 60,        // Slightly larger to reduce marker movement
            spiderfyOnMaxZoom: true,
            chunkedLoading: true,
            zoomToBoundsOnClick: true,
            showCoverageOnHover: false,  // Disable for cleaner appearance
            animate: true,
            animateAddingMarkers: false, // Disable animation when adding markers (reduces jitter)
            spiderfyDistanceMultiplier: 1.5, // More spacing for spiderfied markers
            
            // IMPROVED: Custom icon creation function for truly circular clusters
            iconCreateFunction: (cluster) => {
              const count = cluster.getChildCount();
              let size, bgColor, textColor;
              
              // Get the dominant sensor type in the cluster to determine color
              const sensorTypes = new Map();
              cluster.getAllChildMarkers().forEach((marker: any) => {
                try {
                  // Access the sensor type from our custom property
                  const sensorType = marker.sensorType || 'default';
                  sensorTypes.set(sensorType, (sensorTypes.get(sensorType) || 0) + 1);
                } catch (e) {
                  // Fallback if marker structure is different
                }
              });
              
              let dominantSensorType = 'default';
              let maxCount = 0;
              sensorTypes.forEach((count, sensorType) => {
                if (count > maxCount) {
                  maxCount = count;
                  dominantSensorType = sensorType;
                }
              });
              
              // Get color for dominant sensor type
              bgColor = this.getMarkerColor(dominantSensorType);
              
              // Determine size based on count
              if (count < 10) {
                size = 40;
              } else if (count < 100) {
                size = 50;
              } else {
                size = 60;
              }
              
              textColor = '#FFFFFF';
              
              // Custom HTML for truly circular appearance (with clean modern look)
              return L.divIcon({
                html: `<div style="
                  width: 100%; 
                  height: 100%; 
                  border-radius: 50%; 
                  background-color: ${bgColor}; 
                  border: 2px solid white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                  font-weight: bold;
                  color: ${textColor};
                  font-size: ${count >= 1000 ? '12' : '14'}px;
                ">${count}</div>`,
                className: 'custom-cluster-icon',
                iconSize: [size, size],
                iconAnchor: [size/2, size/2]
              });
            }
          }).addTo(this.map);
          
          // IMPROVED: Better popup handling
          let popupCloseTimeout: number | null = null;
          
          // Close popup when clicking elsewhere on map - with debounce
          this.map.on('click', () => {
            if (this.openPopup) {
              // Slight delay to allow for popup opening to complete
              if (popupCloseTimeout) {
                clearTimeout(popupCloseTimeout);
              }
              popupCloseTimeout = window.setTimeout(() => {
                if (this.openPopup) {
                  this.map.closePopup(this.openPopup);
                  this.openPopup = null;
                }
              }, 50);
            }
          });
          
          // IMPROVED: Debounced update markers when map movement ends
          this.map.on('moveend', () => {
            if (this.mapUpdateTimer) {
              clearTimeout(this.mapUpdateTimer);
            }
            
            this.mapUpdateTimer = setTimeout(() => {
              // Only update visible counts, don't redraw markers (less jitter)
              this.updateMapCounts();
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
        this.updateMapMarkers(true); // true = zoom to fit
        
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
   * IMPROVED: Only update visible marker counts without redrawing markers
   * This prevents jitter when moving the map
   */
  updateMapCounts(): void {
    if (!this.mapInitialized || !this.map) {
      return;
    }
    
    try {
      // Count markers in current viewport
      const bounds = this.map.getBounds();
      let visibleMarkers = 0;
      
      // Count visible markers based on bounds
      this.markers.forEach(marker => {
        if (bounds.contains(marker.getLatLng())) {
          visibleMarkers++;
        }
      });
      
      // Update UI safely
      this.ngZone.run(() => {
        this.markersDisplayed = visibleMarkers;
      });
    } catch (error) {
      console.error('Error updating map counts:', error);
    }
  }
  
  /**
   * IMPROVED: Update map markers based on the filtered alerts - show all markers
   * @param zoomToFit Whether to zoom to fit all markers after loading
   */
  updateMapMarkers(zoomToFit: boolean = false): void {
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
      
      // Track displayed sensor types for the legend
      const newDisplayedSensorTypes: string[] = [];
      
      // IMPROVED: Pre-filter alerts with location data for better performance
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
      
      // Track bounds for all markers to zoom to fit
      const markerBounds = L.latLngBounds([]);
      
      // IMPROVED: Process markers in larger batches for better performance
      const batchSize = 200; // Increased batch size
      
      // IMPROVED: Prepare all marker data first, then create markers in batches
      const markerData = markersToShow.map(alert => {
        // Get color based on sensor type
        const sensorType = alert.sensor_type || 'default';
        
        // Add sensor type to displayedSensorTypes array for legend
        if (!newDisplayedSensorTypes.includes(sensorType)) {
          newDisplayedSensorTypes.push(sensorType);
        }
        
        // Add to bounds for zooming
        if (alert.latitude && alert.longitude) {
          markerBounds.extend([alert.latitude, alert.longitude]);
        }
        
        return {
          alert,
          latlng: [alert.latitude as number, alert.longitude as number],
          sensorType
        };
      });
      
      // IMPROVED: Process batches with better timing
                const processBatch = (startIndex: number) => {
        const endIndex = Math.min(startIndex + batchSize, markerData.length);
        const batch = markerData.slice(startIndex, endIndex);
        
        const newMarkers: any[] = [];
        
        // Create all markers in batch
        batch.forEach(({ alert, latlng, sensorType }) => {
          const marker = this.createLightweightMarker(alert);
          newMarkers.push(marker);
        });
        
        // Add batch of markers at once
        this.markerLayer.addLayers(newMarkers);
        this.markers = this.markers.concat(newMarkers);
        
        // Update progress
        const progress = Math.round((endIndex / markerData.length) * 100);
        this.ngZone.run(() => {
          this.loadingProgress = progress;
        });
        
        // If there are more batches, continue processing with proper timing
        if (endIndex < markerData.length) {
          // Use requestAnimationFrame for smoother batch processing
          requestAnimationFrame(() => {
            setTimeout(() => processBatch(endIndex), 0);
          });
        } else {
          // All batches processed
          console.log(`Added ${this.markers.length} markers to the map`);
          
          // Update UI state inside Angular zone
          this.ngZone.run(() => {
            this.isLoadingMarkers = false;
            this.displayedSensorTypes = newDisplayedSensorTypes; // Update legend
            
            // Fit map to markers if there are any and if requested
            if (this.markers.length > 0 && (zoomToFit || !this.mapWasMoved)) {
              try {
                if (markerBounds.isValid()) {
                  // IMPROVED: Use smoother animation for fitting bounds
                  this.map.flyToBounds(markerBounds, { 
                    padding: [40, 40],
                    maxZoom: 10,
                    duration: 0.75  // Faster animation
                  });
                  console.log('Map fitted to marker bounds');
                } else {
                  console.warn('Invalid bounds for markers');
                }
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
      if (markerData.length > 0) {
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
   * IMPROVED: Create lightweight circle marker with better performance and stability
   * This function creates circular markers with proper styling
   */
  private createLightweightMarker(alert: EventRecord): any {
    const sensorType = alert.sensor_type || 'default';
    const color = this.getMarkerColor(sensorType);
    
    // Create a truly circular marker using divIcon with CSS for guaranteed circle appearance
    const circleIcon = L.divIcon({
      className: 'custom-circle-marker',
      html: `<div style="background-color: ${color}; border: 2px solid white; width: 100%; height: 100%; border-radius: 50%;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    
    // Use marker with custom circle icon
    const marker = L.marker(
      [alert.latitude as number, alert.longitude as number], 
      {
        icon: circleIcon,
        bubblingMouseEvents: false,
        keyboard: false,  // Disable keyboard navigation for better performance
        riseOnHover: true  // Bring to front on hover
      }
    );
    
    // Add sensor type as custom property to the marker after creation
    (marker as any).sensorType = sensorType;
    
    // IMPROVED: Create popup content with enhanced styling
    const popupContent = `
      <div class="custom-popup">
        <div class="popup-header">${alert.sensor_type || 'Unknown Sensor'}</div>
        <div class="popup-content">
          <div class="popup-item"><strong>Industry:</strong> ${alert.industry || 'N/A'}</div>
          <div class="popup-item"><strong>Country:</strong> ${alert.country || 'N/A'}</div>
          <div class="popup-item"><strong>Date:</strong> ${new Date(alert.date_created).toLocaleString()}</div>
          <div class="popup-item"><strong>Total Alerts:</strong> ${this.totalAlerts}</div>
        </div>
      </div>
    `;
    
    // IMPROVED: Add popup with options to prevent jittering
    const popup = L.popup({
      closeButton: true,
      closeOnEscapeKey: true,
      closeOnClick: false,        // Don't close on map click (handled manually)
      autoPan: true,              // Auto-pan the map if popup is not visible
      autoPanPadding: [50, 50],   // More padding for auto-pan (reduces edge cases)
      offset: [0, -5],            // Slight offset
      className: 'custom-popup-container', // Custom class for styling
      keepInView: true            // Keep popup in view while panning
    }).setContent(popupContent);
    
    // IMPROVED: Bind popup with better event handling
    marker.bindPopup(popup);
    
    // IMPROVED: Track the open popup to handle closing with better event management
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      
      // Close any existing popup before opening a new one (prevents multiple popups)
      if (this.openPopup && this.openPopup !== popup) {
        this.map.closePopup(this.openPopup);
      }
      
      this.openPopup = popup;
      marker.openPopup();
    });
    
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
    this.loadData(); // loadData will automatically zoom to fit after loading
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
    
    this.loadData(); // Will zoom to fit all markers
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
  
    // Use the exact date strings from the filter without timezone conversion
    return `${this.appliedFilters.startDate} - ${this.appliedFilters.endDate}`;
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