// /Users/shanzi/iris/iris/src/app/components/dashboard/charts/line-chart/line-chart.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { formatDate } from '@angular/common';
import { EventRecord } from '../../dashboard-data.service';
import 'chartjs-adapter-date-fns'; // Date adapter for time scale

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() data: { date: string, value: number }[] = [];
  @Input() groupBy: string | null = null;
  @Input() alerts: EventRecord[] = [];
  @Input() title: string = '';
  
  @ViewChild('lineCanvas', { static: true }) lineCanvas!: ElementRef;
  chart: Chart | null = null;
  
  ngOnInit(): void {
    // Initialize chart if data is available
    if (this.data && this.data.length > 0) {
      console.log(`Initializing chart with ${this.data.length} data points and ${this.alerts?.length || 0} alerts`);
      this.createChart();
    }
  }
  
  ngAfterViewInit(): void {
    // Ensure the chart is properly sized when the component is fully rendered
    setTimeout(() => {
      if (this.chart) {
        this.chart.resize();
      }
    }, 100);
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // Recreate chart when inputs change
    if ((changes['data'] || changes['groupBy'] || changes['alerts']) && this.data && this.data.length > 0) {
      console.log(`Data changed: ${this.data.length} data points, ${this.alerts?.length || 0} alerts`);
      
      // Check time series data
      const nonZeroPoints = this.data.filter(point => point.value > 0);
      console.log(`Time series has ${nonZeroPoints.length} non-zero points out of ${this.data.length}`);
      
      this.createChart();
      
      // Apply a slight delay to ensure the chart updates correctly
      setTimeout(() => {
        if (this.chart) {
          this.chart.resize();
        }
      }, 100);
    }
  }
  
  private createChart(): void {
    // Destroy existing chart if any
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Sort the dates for consistent display
    const sortedData = [...this.data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Prepare data in Chart.js format - separate labels and values arrays
    const labels = sortedData.map(item => item.date);
    const values = sortedData.map(item => item.value);
    
    // Find the actual date range where data exists
    const dataStartDate = sortedData.length > 0 ? new Date(sortedData[0].date) : null;
    const dataEndDate = sortedData.length > 0 ? new Date(sortedData[sortedData.length - 1].date) : null;
    
    // Add options for date range display
    let dateRangeOptions = {};
    if (dataStartDate && dataEndDate) {
      const displayStartDate = new Date(dataStartDate);
      const displayEndDate = new Date(dataEndDate);
      
      dateRangeOptions = {
        min: displayStartDate.toISOString().split('T')[0],
        max: displayEndDate.toISOString().split('T')[0]
      };
    }
  
    // If groupBy is null, create a simple line chart
    if (!this.groupBy || this.groupBy === 'none' || !this.alerts || this.alerts.length === 0) {
      // Get chart options and apply date range adjustments if needed
      const chartOptions = this.getChartOptions();
      if (Object.keys(dateRangeOptions).length > 0) {
        chartOptions.scales.x = {
          ...chartOptions.scales.x,
          ...dateRangeOptions
        };
      }
      
      // Create a line chart showing total alerts over time
      const config: ChartConfiguration = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Alerts',
            data: values,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: '#e74c3c',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#e74c3c',
            pointHoverBorderWidth: 2,
            tension: 0.3,
            fill: true
          }]
        },
        options: chartOptions
      };
      
      this.chart = new Chart(this.lineCanvas.nativeElement, config);
    } else {
      // For grouped data, process the actual grouping
      const groupedData = this.groupAlertsByDateAndType();
      
      // Check if we got valid grouped data
      if (Object.keys(groupedData).length === 0) {
        // Fallback to ungrouped chart if no grouped data is available
        const chartOptions = this.getChartOptions();
        if (Object.keys(dateRangeOptions).length > 0) {
          chartOptions.scales.x = {
            ...chartOptions.scales.x,
            ...dateRangeOptions
          };
        }
        
        const config: ChartConfiguration = {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Alerts (No Group Data)',
              data: values,
              borderColor: '#e74c3c',
              backgroundColor: 'rgba(231, 76, 60, 0.1)',
              borderWidth: 3,
              pointBackgroundColor: '#e74c3c',
              pointBorderColor: '#fff',
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.3,
              fill: true
            }]
          },
          options: chartOptions
        };
        
        this.chart = new Chart(this.lineCanvas.nativeElement, config);
        return;
      }
      
      // Sort dates for consistent display
      const allDateStrings = labels.sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
      );
      
      // Create one dataset for each group (sensor type, device type, etc.)
      const datasets = Object.entries(groupedData).map(([group, dataByDate], index) => {
        const color = this.getGroupColor(index);
        
        // Create a data array that matches the labels
        const dataValues = allDateStrings.map(dateStr => dataByDate[dateStr] || 0);
        
        // Calculate stats to debug
        const sum = dataValues.reduce((a, b) => a + b, 0);
        const max = Math.max(...dataValues);
        console.log(`Dataset ${group}: sum=${sum}, max=${max}, avg=${(sum/dataValues.length).toFixed(2)}`);
        
        return {
          label: this.formatGroupName(group),
          data: dataValues,
          borderColor: color,
          backgroundColor: this.hexToRgba(color, 0.1),
          borderWidth: 2,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: true
        };
      });
      
      // Apply date range adjustments to grouped data charts too
      const chartOptions = this.getChartOptions(true);
      if (Object.keys(dateRangeOptions).length > 0) {
        chartOptions.scales.x = {
          ...chartOptions.scales.x,
          ...dateRangeOptions
        };
      }
      
      // Create the grouped line chart with a dataset for each group
      const config: ChartConfiguration = {
        type: 'line',
        data: {
          labels: allDateStrings,
          datasets: datasets
        },
        options: chartOptions
      };
      
      this.chart = new Chart(this.lineCanvas.nativeElement, config);
    }
  }
  
  /**
   * Groups alerts by date and type (sensor_type, device_type, etc.)
   * This function analyzes all alerts and creates a data structure 
   * that can be used by Chart.js to display grouped data
   */
  private groupAlertsByDateAndType(): Record<string, Record<string, number>> {
    if (!this.groupBy || !this.data || this.data.length === 0 || !this.alerts || this.alerts.length === 0) {
      return {};
    }
    
    console.log(`Grouping ${this.alerts.length} alerts by ${this.groupBy}`);
    
    // Find date range from the data
    const dates = this.data.map(item => item.date).sort();
    console.log(`Date range: ${dates[0]} to ${dates[dates.length - 1]}, ${dates.length} days`);
    
    // Create a result structure for each type and date
    const result: Record<string, Record<string, number>> = {};
    
    // First, get all unique values for the grouping field
    const groupValues = [...new Set(this.alerts.map(alert => {
      return alert[this.groupBy as keyof EventRecord] || 'Unknown';
    }))];
    
    console.log(`Found ${groupValues.length} unique ${this.groupBy} values:`, groupValues);
    
    // Initialize all groups with zero counts for each date
    groupValues.forEach(groupValue => {
      if (groupValue !== undefined && groupValue !== null) {
        result[String(groupValue)] = {};
        dates.forEach(date => {
          result[String(groupValue)][date] = 0;
        });
      }
    });
    
    // Count alerts by date and group - with detailed debugging
    let totalCounted = 0;
    let datesNotFound = 0;
    
    // Sample a few alerts to debug date formats
    if (this.alerts.length > 0) {
      console.log('Sample alert format:', this.alerts[0]);
    }
    
    const dateMap = new Map<string, string[]>();
    
    // Create a map of normalized dates for faster lookups
    const normalizedDateMap = new Map<string, string>();
    dates.forEach(date => {
      const normalized = new Date(date).toISOString().split('T')[0];
      normalizedDateMap.set(normalized, date);
    });
    
    this.alerts.forEach(alert => {
      if (!this.groupBy) return;
      
      // Extract the date part from date_created (format: YYYY-MM-DD HH:MM:SS)
      const alertDateParts = alert.date_created.split(' ');
      const dateStr = alertDateParts[0]; // Extract YYYY-MM-DD
      
      // IMPORTANT FIX: Normalize the alert date for matching
      const normalizedAlertDate = new Date(dateStr).toISOString().split('T')[0];
      
      // Find the corresponding original date from our normalized map
      const matchingOriginalDate = normalizedDateMap.get(normalizedAlertDate);
      
      // If no matching date was found
      if (!matchingOriginalDate) {
        // Track which dates are not found
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, []);
        }
        dateMap.get(dateStr)?.push(String(alert[this.groupBy as keyof EventRecord] || 'Unknown'));
        
        datesNotFound++;
        return;
      }
      
      // Get the group value for this alert
      const groupValue = String(alert[this.groupBy as keyof EventRecord] || 'Unknown');
      
      // Increment the count for this group and date - use the matching date from our chart data
      if (result[groupValue]) {
        result[groupValue][matchingOriginalDate] = (result[groupValue][matchingOriginalDate] || 0) + 1;
        totalCounted++;
      }
    });
    
    console.log(`Counted ${totalCounted} alerts, ${datesNotFound} alerts had dates not in chart range`);
    
    // If we have lots of dates not found, log some of them
    if (datesNotFound > 0) {
      const missedDates = Array.from(dateMap.entries()).slice(0, 5);
      console.log('Sample dates not found:', missedDates);
    }
    
    // Log some sample data to verify
    Object.entries(result).slice(0, 3).forEach(([group, dateValues]) => {
      const nonZeroDates = Object.entries(dateValues)
        .filter(([_, value]) => value > 0)
        .slice(0, 5);
      
      console.log(`Sample data for group ${group}:`, nonZeroDates);
    });
    
    // Filter out groups with minimal data (less than 10% of the largest group)
    const groupSums: { group: string, sum: number }[] = [];
    Object.entries(result).forEach(([group, dateCounts]) => {
      const sum = Object.values(dateCounts).reduce((acc, val) => acc + val, 0);
      groupSums.push({ group, sum });
    });
    
    groupSums.sort((a, b) => b.sum - a.sum);
    console.log('Group sums:', groupSums);
    
    if (groupSums.length > 0) {
      const largestSum = groupSums[0].sum;
      const threshold = largestSum * 0.1;
      
      const mainGroups = groupSums.filter(item => item.sum >= threshold);
      const smallGroups = groupSums.filter(item => item.sum < threshold);
      
      if (smallGroups.length > 0) {
        // Combine small groups into "Other"
        const otherCounts: Record<string, number> = {};
        dates.forEach(date => {
          otherCounts[date] = smallGroups.reduce((sum, { group }) => {
            return sum + (result[group][date] || 0);
          }, 0);
        });
        
        // Keep only main groups and add "Other"
        const filteredResult: Record<string, Record<string, number>> = {};
        mainGroups.forEach(({ group }) => {
          filteredResult[group] = result[group];
        });
        
        // Only add "Other" if it has some non-zero values
        if (Object.values(otherCounts).some(v => v > 0)) {
          filteredResult['Other'] = otherCounts;
        }
        
        return filteredResult;
      }
    }
    
    return result;
  }
  
  /**
   * Configure chart options
   * @param showLegend Whether to show the legend (true for grouped data)
   */
  private getChartOptions(showLegend: boolean = false): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 20,
          top: 20,
          bottom: 50
        }
      },
      plugins: {
        legend: {
          display: showLegend,
          position: 'top',
          labels: {
            color: '#aaa',
            font: {
              size: 11
            },
            padding: 15,
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(27, 27, 27, 0.95)',
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          padding: 12,
          cornerRadius: 6,
          displayColors: true,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1
        },
        title: {
          display: this.title !== '',
          text: this.title,
          color: '#f0f0f0',
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        }
      },
      scales: {
        x: {
          type: 'category',  // Use category scale instead of time
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            display: true
          },
          ticks: {
            padding: 10,
            color: '#aaa',
            font: {
              size: 11
            },
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          beginAtZero: true,
          suggestedMax: 10, // Start with a reasonable max value
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#aaa',
            font: {
              size: 11
            },
            padding: 8,
            precision: 0
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      elements: {
        line: {
          borderJoinStyle: 'round'
        },
        point: {
          radius: 3,
          hoverRadius: 5,
          hitRadius: 10
        }
      }
    };
  }
  
  /**
   * Format group names for better readability in the chart legend
   */
  private formatGroupName(name: string): string {
    // Format group names to be more readable
    if (!name) return 'Unknown';
    
    // Replace underscores with spaces
    let formatted = name.replace(/_/g, ' ');
    
    // Capitalize each word
    formatted = formatted.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Truncate long names to prevent overflow
    if (formatted.length > 30) {
      formatted = formatted.substring(0, 27) + '...';
    }
    
    return formatted;
  }
  
  /**
   * Get a color for each group based on index
   */
  private getGroupColor(index: number): string {
    const colors = [
      '#e74c3c', // Red
      '#3498db', // Blue
      '#2ecc71', // Green
      '#f39c12', // Orange
      '#9b59b6', // Purple
      '#1abc9c', // Teal
      '#34495e', // Dark Blue
      '#e67e22', // Dark Orange
      '#27ae60', // Dark Green
      '#d35400'  // Dark Red
    ];
    
    return colors[index % colors.length];
  }
  
  /**
   * Convert hex color to rgba for transparency
   */
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}