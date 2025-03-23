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
  private markerLayer!: L.MarkerClusterGroup;
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
  showAllMarkers: boolean = false;
  
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
  totalAlertsWithLocation: number = 0;
  uniqueLocations: number = 0;
  uniqueCountries: number = 0;
  
  // 限制最大标记数量以提高性能
  private readonly MAX_VISIBLE_MARKERS = 500;
  
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
  
  constructor(
    private mapDataService: MapDataService,
    private ngZone: NgZone
  ) {
    console.log('MapComponent constructed');
  }
  
  ngOnInit(): void {
    console.log('MapComponent initialized');
    
    // 设置默认日期范围 - 最近12小时
    const today = new Date();
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(today.getHours() - 12);
    
    this.appliedFilters.endDate = this.formatDate(today);
    this.appliedFilters.startDate = this.formatDate(twelveHoursAgo);
    
    console.log('Default date range set:', this.appliedFilters.startDate, 'to', this.appliedFilters.endDate);
    
    // 先初始化地图，然后再加载数据
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
      // 确保在Angular区域内执行地图初始化
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
          
          // 确保地图容器有宽高
          if (mapDiv.clientHeight === 0 || mapDiv.clientWidth === 0) {
            console.warn('Map container has zero height or width!');
            mapDiv.style.height = '500px';
            mapDiv.style.width = '100%';
          }
          
          // Create map instance with improved settings
          this.map = L.map('map', {
            center: [20, 0],
            zoom: 2,
            preferCanvas: true,    // 使用Canvas渲染提高性能
            wheelDebounceTime: 150, // 滚轮防抖时间
            zoomSnap: 0.5,         // 平滑缩放
            zoomDelta: 0.5,        // 平滑缩放步长
            markerZoomAnimation: true
          });
          
          // Add tile layer (dark theme to match dashboard)
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: 'abcd',
            maxZoom: 19
          }).addTo(this.map);
          
          // 初始化聚合标记层
          this.markerLayer = L.markerClusterGroup({
            disableClusteringAtZoom: 13,  // 缩放级别大于13时显示单独的标记
            maxClusterRadius: 50,         // 聚合半径
            spiderfyOnMaxZoom: true,      // 在最大缩放级别时展开聚合
            chunkedLoading: true,         // 分块加载提高性能
            zoomToBoundsOnClick: true,    // 点击聚合时缩放到边界
            showCoverageOnHover: false,   // 不显示聚合范围
            animate: true                 // 动画效果
          }).addTo(this.map);
          
          // 地图移动结束时更新标记
          this.map.on('moveend', () => {
            if (this.mapUpdateTimer) {
              clearTimeout(this.mapUpdateTimer);
            }
            
            this.mapUpdateTimer = setTimeout(() => {
              this.updateMapMarkers();
            }, 300); // 300ms延迟
          });
          
          this.mapInitialized = true;
          console.log('Map initialized successfully');
          
          // Fix map rendering - 必须在Angular区域内设置状态
          this.ngZone.run(() => {
            setTimeout(() => {
              console.log('Invalidating map size');
              this.map.invalidateSize();
              // 现在加载数据
              this.loadData();
            }, 500);
          });
        }, 300); // 稍微延迟确保DOM已准备好
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
    
    // 确保地图初始化后再加载数据
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
    
    // Group countries by continent (simplified example)
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
   * Update map markers based on the filtered alerts
   */
  updateMapMarkers(): void {
    console.log('Updating map markers');
    
    if (!this.mapInitialized || !this.map) {
      console.error('Cannot update markers: Map not initialized');
      return;
    }
    
    // 确保在Angular区域外执行标记更新，提高性能
    this.ngZone.runOutsideAngular(() => {
      this.isLoadingMarkers = true;
      this.loadingProgress = 0;
      
      // Clear existing markers
      this.markerLayer.clearLayers();
      this.markers = [];
      
      // 获取当前视图边界，只显示可见区域的标记
      const bounds = this.map.getBounds();
      
      // Track displayed sensor types for the legend
      this.displayedSensorTypes = [];
      
      // Add new markers for each alert with location data
      const alertsWithLocation = this.alerts.filter(alert => 
        alert.latitude !== undefined && 
        alert.latitude !== null && 
        alert.longitude !== undefined && 
        alert.longitude !== null &&
        (this.showAllMarkers || bounds.contains([alert.latitude, alert.longitude]))
      );
      
      this.ngZone.run(() => {
        this.totalAlertsWithLocation = alertsWithLocation.length;
      });
      
      console.log(`Found ${alertsWithLocation.length} alerts with valid location data`);
      
      // 限制标记数量以提高性能
      const maxMarkers = this.showAllMarkers ? alertsWithLocation.length : Math.min(this.MAX_VISIBLE_MARKERS, alertsWithLocation.length);
      const markersToShow = alertsWithLocation.slice(0, maxMarkers);
      
      this.ngZone.run(() => {
        this.markersDisplayed = markersToShow.length;
      });
      
      if (alertsWithLocation.length > maxMarkers && !this.showAllMarkers) {
        console.log(`Limiting display to ${maxMarkers} out of ${alertsWithLocation.length} markers`);
      }
      
      // 批量创建标记以提高性能
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
          
          // 创建轻量级标记
          const marker = this.createLightweightMarker(alert);
          newMarkers.push(marker);
        });
        
        // 一次性添加整批标记
        this.markerLayer.addLayers(newMarkers);
        this.markers = this.markers.concat(newMarkers);
        
        // 更新进度
        const progress = Math.round((endIndex / markersToShow.length) * 100);
        this.ngZone.run(() => {
          this.loadingProgress = progress;
        });
        
        // 如果还有更多批次，继续处理
        if (endIndex < markersToShow.length) {
          setTimeout(() => processBatch(endIndex), 10);
        } else {
          // 所有批次处理完毕
          console.log(`Added ${this.markers.length} markers to the map`);
          
          // 在Angular区域内更新UI状态
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
      
      // 跟踪地图是否已被用户移动
      this.mapWasMoved = this.map.getCenter().lat !== 20 || this.map.getCenter().lng !== 0;
      
      // 开始第一批处理
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
   * 创建轻量级的圆形标记，比传统标记性能更好
   */
  private createLightweightMarker(alert: EventRecord): L.CircleMarker {
    const sensorType = alert.sensor_type || 'default';
    const color = this.getMarkerColor(sensorType);
    
    const marker = L.circleMarker(
      [alert.latitude as number, alert.longitude as number], 
      {
        radius: 6,             // 半径
        fillColor: color,      // 填充颜色
        color: '#fff',         // 边框颜色
        weight: 1,             // 边框宽度
        opacity: 1,            // 不透明度
        fillOpacity: 0.7       // 填充不透明度
      }
    );
    
    // 创建弹出窗口内容
    const popupContent = `
      <div style="padding: 6px;">
        <div style="font-weight: bold; margin-bottom: 6px;">${alert.sensor_type || 'Unknown Sensor'}</div>
        <div>Industry: ${alert.industry || 'N/A'}</div>
        <div>Country: ${alert.country || 'N/A'}</div>
        <div>Date: ${new Date(alert.date_created).toLocaleString()}</div>
      </div>
    `;
    
    // 添加弹出窗口
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
   * Toggle between showing all markers and only visible area markers
   */
  toggleAllMarkers(): void {
    this.showAllMarkers = !this.showAllMarkers;
    this.updateMapMarkers();
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
    // 重置为默认过滤器，使用更短的时间范围
    const today = new Date();
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(today.getHours() - 12);
    
    this.appliedFilters = {
      sensorTypes: [],
      industries: [],
      countries: [],
      continents: [],
      startDate: this.formatDate(twelveHoursAgo),
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
    
    // 日期过滤器也计入总数
    if (this.appliedFilters.startDate) count++;
    if (this.appliedFilters.endDate) count++;
    
    return count;
  }
  
  /**
   * 获取日期范围文本以用于显示
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
   * 获取性能提示文本
   */
  getPerformanceMessage(): string {
    if (this.totalAlertsWithLocation <= this.markersDisplayed) {
      return '';
    }
    
    return `Showing ${this.markersDisplayed} out of ${this.totalAlertsWithLocation} locations for better performance.`;
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
  
  // 跟踪地图是否被移动
  private mapWasMoved: boolean = false;
}