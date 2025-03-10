import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../services/state.service';
import { DashboardDataService, EventRecord, FilterOptions } from './dashboard-data.service';

import { DashboardFiltersComponent } from './dashboard-filters/dashboard-filters.component';
import { BarChartComponent } from './charts/bar-chart/bar-chart.component';
import { LineChartComponent } from './charts/line-chart/line-chart.component';
import { MetricCardComponent } from './metric-card/metric-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DashboardFiltersComponent,
    BarChartComponent,
    LineChartComponent,
    MetricCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  username: string = 'User';
  currentDateTime: Date = new Date();
  
  // Dashboard state
  isFilterPanelOpen: boolean = false;
  isLoading: boolean = true;
  error: string | null = null;
  
  // Data
  alerts: EventRecord[] = [];
  filterOptions: FilterOptions | null = null;
  
  // Filters
  appliedFilters: any = {
    sensorTypes: [],
    industries: [],
    eventTypes: [],
    resolutionReasons: [],
    deviceTypes: [],
    countries: [],
    continents: [],
    startDate: '',
    endDate: ''
  };
  
  // Metrics
  totalAlerts: number = 0;
  avgAlertsPerDay: number = 0;
  
  // Chart data
  distributionData: { name: string, value: number }[] = [];
  alertsTimeSeries: { date: string, value: number }[] = [];
  
  // Selected distribution variable for bar chart
  selectedDistributionVariable: 'sensor_type' | 'resolution_reason' | 'device_type' | 'industry' | 'event_type' = 'sensor_type';
  
  // Selected grouping variable for line chart
  selectedGroupingVariable: 'none' | 'resolution_reason' | 'industry' | 'event_type' | 'sensor_type' | 'device_type' = 'none';
  
  constructor(
    private stateService: StateService,
    private dashboardDataService: DashboardDataService
  ) {
    const storedUsername = this.stateService.getState('username');
    if (storedUsername) {
      this.username = storedUsername;
    }
    
    // Set up time update interval
    setInterval(() => {
      this.currentDateTime = new Date();
    }, 60000); // Update every minute
  }
  
  ngOnInit(): void {
    // Load data without setting default date range
    this.loadData();
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  toggleFilterPanel(): void {
    this.isFilterPanelOpen = !this.isFilterPanelOpen;
  }
  
  loadData(): void {
    this.isLoading = true;
    this.error = null;
    
    // Convert the filter format for the API
    const apiFilters = {
      sensorTypes: this.appliedFilters.sensorTypes,
      industries: this.appliedFilters.industries,
      eventTypes: this.appliedFilters.eventTypes,
      resolutionReasons: this.appliedFilters.resolutionReasons,
      deviceTypes: this.appliedFilters.deviceTypes,
      countries: this.appliedFilters.countries,
      continents: this.appliedFilters.continents,
      startDate: this.appliedFilters.startDate || undefined,
      endDate: this.appliedFilters.endDate || undefined
    };
    
    this.dashboardDataService.getAlerts(apiFilters).subscribe({
      next: (response) => {
        this.alerts = response.alerts;
        this.totalAlerts = response.metrics.total_alerts;
        this.avgAlertsPerDay = response.metrics.avg_alerts_per_day;
        
        // Extract filter options from the response
        this.filterOptions = {
          sensorTypes: response.meta.sensorTypes,
          industries: response.meta.industries,
          eventTypes: response.meta.eventTypes,
          resolutionReasons: response.meta.resolutionReasons,
          deviceTypes: response.meta.deviceTypes,
          countries: response.meta.countries
        };
        
        // Debug logging to check distribution data
        console.log('Selected distribution variable:', this.selectedDistributionVariable);
        console.log('Distribution data from API:', response.metrics?.distribution_data);
        
        // Process distribution data for the selected variable
        const distributionKey = this.selectedDistributionVariable;
        if (response.metrics?.distribution_data && response.metrics.distribution_data[distributionKey]) {
          console.log('Processing API distribution data for:', distributionKey);
          this.processDistributionData(response.metrics.distribution_data[distributionKey]);
        } else {
          // If no distribution data from API, generate it from alerts
          console.log('No distribution data from API, generating from alerts');
          this.generateDistributionDataFromAlerts();
        }
        
        // Process time series data
        this.processTimeSeriesData(response.alerts);
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load alerts:', err);
        this.error = 'Failed to load alert data. Please try again later.';
        this.isLoading = false;
      }
    });
  }
  
  updateFilters(filters: any): void {
    this.appliedFilters = { ...filters };
  }

  processDistributionData(distributionData: Record<string, number> | undefined): void {
    if (!distributionData) {
      this.distributionData = [];
      return;
    }
    
    console.log('Raw distribution data:', distributionData);
    
    // Convert the distribution object from API to chart format
    this.distributionData = Object.entries(distributionData).map(([name, value]) => {
      return { name, value };
    });
    
    console.log('Transformed distribution data:', this.distributionData);
    
    // Sort by value descending for better visualization
    this.distributionData.sort((a, b) => b.value - a.value);
    
    // Combine small groups into "Other" category (less than 10% of largest group)
    if (this.distributionData.length > 0) {
      const largestValue = this.distributionData[0].value;
      const threshold = largestValue * 0.1;
      
      const mainGroups = this.distributionData.filter(item => item.value >= threshold);
      const smallGroups = this.distributionData.filter(item => item.value < threshold);
      
      if (smallGroups.length > 0) {
        const otherValue = smallGroups.reduce((sum, item) => sum + item.value, 0);
        
        this.distributionData = [
          ...mainGroups,
          { name: 'Other', value: otherValue }
        ];
      }
    }
    
    console.log('Final distribution data:', this.distributionData);
  }
  
  // New method to generate distribution data from alerts if API doesn't provide it
  generateDistributionDataFromAlerts(): void {
    if (!this.alerts || this.alerts.length === 0) {
      console.log('No alerts available to generate distribution data');
      
      // Create sample data if no alerts are available
      this.distributionData = [
        { name: 'CO', value: 3 },
        { name: 'H2S', value: 2 },
        { name: 'CO2', value: 4 },
        { name: 'O2', value: 2 },
        { name: 'LEL', value: 1 }
      ];
      
      return;
    }
    
    const key = this.selectedDistributionVariable;
    const countMap: Record<string, number> = {};
    
    // Count occurrences of each value
    this.alerts.forEach(alert => {
      const value = alert[key];
      if (value) {
        const valueStr = String(value);
        countMap[valueStr] = (countMap[valueStr] || 0) + 1;
      }
    });
    
    console.log('Generated distribution data:', countMap);
    
    // Convert to expected format and sort
    this.distributionData = Object.entries(countMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    console.log('Formatted distribution data:', this.distributionData);
  }
  
  processTimeSeriesData(alerts: EventRecord[]): void {
    // Group alerts by date and count them
    const dateGroups: Record<string, number> = {};
    
    alerts.forEach(alert => {
      // Extract date part only (YYYY-MM-DD) from the datetime string
      const dateStr = alert.date_created.split(' ')[0];
      
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = 0;
      }
      
      dateGroups[dateStr]++;
    });
    
    // Convert to chart format and sort by date
    this.alertsTimeSeries = Object.entries(dateGroups)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  applyFilters(filters: any): void {
    this.appliedFilters = { ...filters };
    this.loadData();
    
    // Close filter panel after applying on all screen sizes
    this.isFilterPanelOpen = false;
  }
  
  resetFilters(): void {
    // Reset to empty filters without date range defaults
    this.appliedFilters = {
      sensorTypes: [],
      industries: [],
      eventTypes: [],
      resolutionReasons: [],
      deviceTypes: [],
      countries: [],
      continents: [],
      startDate: '',
      endDate: ''
    };
    
    this.loadData();
  }
  
  changeDistributionVariable(): void {
    console.log('Distribution variable changed to:', this.selectedDistributionVariable);
    if (this.dashboardDataService) {
      this.loadData();
    }
  }
  
  changeGroupingVariable(): void {
    // The line chart component will handle grouping based on the selected variable
    // No need to reload data, just update the UI
  }

  getDistributionTitle(): string {
    const variableNames: Record<string, string> = {
      'sensor_type': 'Sensor Types',
      'resolution_reason': 'Resolution Reasons',
      'device_type': 'Device Types',
      'industry': 'Industries',
      'event_type': 'Event Types'
    };
    
    return variableNames[this.selectedDistributionVariable] || 'Distribution';
  }

  getTotalDistributionValue(): number {
    return this.distributionData.reduce((sum, item) => sum + item.value, 0);
  }
  
  getFormattedAvgAlerts(): string {
    return this.avgAlertsPerDay.toFixed(1);
  }
  
  getTopCategoryPercentage(): string {
    if (this.distributionData.length === 0 || this.getTotalDistributionValue() === 0) {
      return '0';
    }
    
    const percentage = (this.distributionData[0].value / this.getTotalDistributionValue()) * 100;
    return percentage.toFixed(0);
  }

  getDateRangeText(): string {
    if (!this.appliedFilters.startDate || !this.appliedFilters.endDate) {
      return 'All time';
    }

    const startDate = new Date(this.appliedFilters.startDate);
    const endDate = new Date(this.appliedFilters.endDate);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }

  hasActiveFilters(): boolean {
    return Object.keys(this.appliedFilters).some(key => {
      if (Array.isArray(this.appliedFilters[key])) {
        return this.appliedFilters[key].length > 0;
      }
      return !!this.appliedFilters[key];
    });
  }

  getActiveFiltersCount(): number {
    let count = 0;
    
    // Count array filters
    ['sensorTypes', 'industries', 'eventTypes', 'resolutionReasons', 'deviceTypes', 'countries', 'continents'].forEach(key => {
      if (this.appliedFilters[key] && this.appliedFilters[key].length > 0) {
        count++;
      }
    });
    
    // Count date filters
    if (this.appliedFilters.startDate) count++;
    if (this.appliedFilters.endDate) count++;
    
    return count;
  }

  // Handle window resize for responsive design
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    if (window.innerWidth > 768 && window.innerWidth <= 992) {
      this.isFilterPanelOpen = false; // Auto-collapse on medium screens
    }
  }
}