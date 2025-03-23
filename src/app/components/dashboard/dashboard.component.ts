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
    // Set default date range - last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 14);
    
    this.appliedFilters.endDate = this.formatDate(today);
    this.appliedFilters.startDate = this.formatDate(thirtyDaysAgo);
    
    // Load data with default date range
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
        
        // Create filter options from distinct values if not already available
        if (!this.filterOptions) {
          this.initializeFilterOptions(response.alerts);
        }
        
        // Process distribution data for the selected variable
        const distributionKey = this.selectedDistributionVariable;
        if (response.metrics?.distribution_data && response.metrics.distribution_data[distributionKey]) {
          this.processDistributionData(response.metrics.distribution_data[distributionKey]);
        } else {
          // If no distribution data from API, generate it from alerts
          this.generateDistributionDataFromAlerts();
        }
        
        // Process time series data - check if the API provided time_series data
        if (response.time_series && response.time_series.length > 0) {
          this.alertsTimeSeries = response.time_series;
        } else {
          // Fallback to processing from alerts
          this.processTimeSeriesData(response.alerts);
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load alerts:', err);
        this.error = 'Failed to load alert data. Please try again later.';
        this.isLoading = false;
      }
    });
  }
  
  initializeFilterOptions(alerts: EventRecord[]): void {
    // Extract unique values for each filter from the alerts
    const sensorTypes = [...new Set(alerts.map(alert => alert.sensor_type))].filter(Boolean);
    const industries = [...new Set(alerts.map(alert => alert.industry))].filter(Boolean);
    const eventTypes = [...new Set(alerts.map(alert => alert.event_type))].filter(Boolean);
    const resolutionReasons = [...new Set(alerts.map(alert => alert.resolution_reason))].filter(Boolean);
    const deviceTypes = [...new Set(alerts.map(alert => alert.device_type))].filter(Boolean);
    
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
      eventTypes: eventTypes.sort(),
      resolutionReasons: resolutionReasons.sort(),
      deviceTypes: deviceTypes.sort(),
      countries: {
        'EU': euCountries.sort(),
        'North America': naCountries.sort(),
        'Other': otherCountries.sort()
      }
    };
  }
  
  updateFilters(filters: any): void {
    this.appliedFilters = { ...filters };
  }

  processDistributionData(distributionData: Record<string, number> | undefined): void {
    if (!distributionData) {
      this.distributionData = [];
      return;
    }
    
    // Convert the distribution object from API to chart format
    this.distributionData = Object.entries(distributionData).map(([name, value]) => {
      return { name, value };
    });
    
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
  }
  
  // Generate distribution data from alerts if API doesn't provide it
  generateDistributionDataFromAlerts(): void {
    if (!this.alerts || this.alerts.length === 0) {
      this.distributionData = [];
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
    
    // Convert to expected format and sort
    this.distributionData = Object.entries(countMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
    // Apply same consolidation logic for small groups
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
  }
  
  processTimeSeriesData(alerts: EventRecord[]): void {
    // Exit early if no alerts
    if (!alerts || alerts.length === 0) {
      this.alertsTimeSeries = [];
      return;
    }
    
    console.log('Processing time series data from', alerts.length, 'alerts');
    
    // Group alerts by date and count them
    const dateGroups: Record<string, number> = {};
    
    // Get date range from filters or use alerts min/max dates
    let startDate: Date, endDate: Date;
    
    if (this.appliedFilters.startDate && this.appliedFilters.endDate) {
      startDate = new Date(this.appliedFilters.startDate);
      endDate = new Date(this.appliedFilters.endDate);
    } else {
      // Find min and max dates from alerts
      const dates = alerts.map(alert => {
        try {
          // Handle different date formats
          const datePart = alert.date_created.split(' ')[0]; // Extract YYYY-MM-DD
          return new Date(datePart);
        } catch (e) {
          console.error('Invalid date:', alert.date_created);
          return null;
        }
      }).filter(date => date !== null && !isNaN(date.getTime())) as Date[];
      
      if (dates.length === 0) {
        this.alertsTimeSeries = [];
        return;
      }
      
      startDate = new Date(Math.min(...dates.map(d => d.getTime())));
      endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    }
    
    console.log('Date range:', startDate, 'to', endDate);
    
    // Generate all dates in the range for consistent data
    const allDates: string[] = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    
    const lastDate = new Date(endDate);
    lastDate.setHours(0, 0, 0, 0);
    
    // Initialize all dates with zero count
    while (currentDate <= lastDate) {
      const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      dateGroups[dateStr] = 0;
      allDates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Count alerts by date
    alerts.forEach(alert => {
      try {
        // Extract date part from the date_created field
        const alertDateParts = alert.date_created.split(' ');
        const dateStr = alertDateParts[0]; // Extract YYYY-MM-DD
        
        if (dateGroups[dateStr] !== undefined) {
          dateGroups[dateStr]++;
        } else {
          // Find closest date if the exact date is not in our range
          const closestDate = this.findClosestDate(dateStr, allDates);
          if (closestDate) {
            dateGroups[closestDate]++;
          }
        }
      } catch (e) {
        console.error('Error processing alert date:', alert.date_created, e);
      }
    });
    
    // Convert to chart format and sort by date
    this.alertsTimeSeries = Object.entries(dateGroups)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    console.log('Time series data processed:', this.alertsTimeSeries.length, 'data points');
  }

  // Helper method to find closest date
  findClosestDate(targetDateStr: string, dates: string[]): string | undefined {
    if (!targetDateStr || dates.length === 0) return undefined;
    
    // Try direct match first
    if (dates.includes(targetDateStr)) {
      return targetDateStr;
    }
    
    try {
      const targetDate = new Date(targetDateStr);
      let closestDate = dates[0];
      let smallestDiff = Math.abs(targetDate.getTime() - new Date(dates[0]).getTime());
      
      for (let i = 1; i < dates.length; i++) {
        const currentDate = new Date(dates[i]);
        const diff = Math.abs(targetDate.getTime() - currentDate.getTime());
        
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestDate = dates[i];
        }
      }
      
      return closestDate;
    } catch (e) {
      console.error("Error finding closest date:", e);
      return dates[0]; // Fallback to first date
    }
  }
  
  applyFilters(filters: any): void {
    this.appliedFilters = { ...filters };
    this.loadData();
    
    // Close filter panel after applying on all screen sizes
    this.isFilterPanelOpen = false;
  }
  
  resetFilters(): void {
    // Reset to empty filters with default date range
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.appliedFilters = {
      sensorTypes: [],
      industries: [],
      eventTypes: [],
      resolutionReasons: [],
      deviceTypes: [],
      countries: [],
      continents: [],
      startDate: this.formatDate(thirtyDaysAgo),
      endDate: this.formatDate(today)
    };
    
    this.loadData();
  }
  
  changeDistributionVariable(): void {
    // Either load data from API again or regenerate from existing alerts
    this.generateDistributionDataFromAlerts();
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