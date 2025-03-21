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
    if (this.data && this.data.length > 0) {
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
    if ((changes['data'] || changes['groupBy'] || changes['alerts']) && this.data && this.data.length > 0) {
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
    
    // Determine if data is clustered (concentrated in less than 20% of the total range)
    let dateRangeOptions = {};
    if (dataStartDate && dataEndDate) {
      const displayStartDate = new Date(dataStartDate);
      const displayEndDate = new Date(dataEndDate);
      
      // Add padding to the date range (10% on each side)
      const totalRange = displayEndDate.getTime() - displayStartDate.getTime();
      
      // Check if all data points are clustered within a small part of the range
      const activeDataPoints = sortedData.filter(point => 
        new Date(point.date).getTime() > (displayEndDate.getTime() - (totalRange * 0.2))
      );
      
      // If more than 80% of points are in the last 20% of the range, adjust visualization
      if (activeDataPoints.length > 0 && activeDataPoints.length > sortedData.length * 0.8) {
        const buffer = Math.max(5 * 24 * 60 * 60 * 1000, totalRange * 0.3); // At least 5 days or 30% of range
        displayStartDate.setTime(displayEndDate.getTime() - buffer);
        
        // Set the date range options to focus on where the data actually is
        dateRangeOptions = {
          min: displayStartDate.toISOString().split('T')[0],
          max: new Date(displayEndDate.getTime() + (buffer * 0.1)).toISOString().split('T')[0]
        };
      }
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
      
      // Generate all dates in range for consistent data points
      const allDates = this.generateAllDatesInRange(
        new Date(Math.min(...sortedData.map(d => new Date(d.date).getTime()))),
        new Date(Math.max(...sortedData.map(d => new Date(d.date).getTime())))
      );
      
      // Sort dates and create a common set of labels
      const allDateStrings = allDates.map(date => date.toISOString().split('T')[0]).sort();
      
      const datasets = Object.entries(groupedData).map(([group, dataByDate], index) => {
        const color = this.getGroupColor(index);
        
        // Create a data array that matches the labels
        const dataValues = allDateStrings.map(dateStr => dataByDate[dateStr] || 0);
        
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
  
  // Generate all dates within a date range (for consistent time series)
  private generateAllDatesInRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    // Set time to midnight for consistent date comparison
    currentDate.setHours(0, 0, 0, 0);
    const lastDate = new Date(endDate);
    lastDate.setHours(0, 0, 0, 0);
    
    // Calculate total days in range
    const totalDays = Math.round((lastDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // For very large date ranges, we'll sample dates to avoid performance issues
    // (more than 60 days)
    if (totalDays > 60) {
      const interval = Math.ceil(totalDays / 60);
      while (currentDate <= lastDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + interval);
      }
      
      // Make sure the end date is included
      if (dates.length === 0 || dates[dates.length - 1].getTime() !== lastDate.getTime()) {
        dates.push(new Date(lastDate));
      }
    } else {
      // For smaller ranges, include every day
      while (currentDate <= lastDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return dates;
  }
  
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
  
  private groupAlertsByDateAndType(): Record<string, Record<string, number>> {
    if (!this.groupBy || !this.alerts || this.alerts.length === 0 || !this.data || this.data.length === 0) {
      return {};
    }
    
    // Find date range from the data
    const dates = this.data.map(item => item.date).sort();
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);
    
    // Generate all dates in the range for consistent data points
    const allDates = this.generateAllDatesInRange(startDate, endDate)
      .map(d => d.toISOString().split('T')[0]);
    
    // Get all unique group values
    const groupValues = [...new Set(this.alerts.map(alert => {
      return alert[this.groupBy as keyof EventRecord] || 'Unknown';
    }))];
    
    // Create a result structure with all dates initialized to 0
    const result: Record<string, Record<string, number>> = {};
    groupValues.forEach(groupValue => {
      if (groupValue !== undefined && groupValue !== null) {
        result[String(groupValue)] = {};
        allDates.forEach(date => {
          result[String(groupValue)][date] = 0;
        });
      }
    });
    
    // Fill in the data by counting alerts for each group and date
    this.alerts.forEach(alert => {
      // Extract date part from the date_created field
      const alertDateParts = alert.date_created.split(' ');
      const alertDateStr = alertDateParts[0]; // Extract YYYY-MM-DD
      
      if (this.groupBy) {
        const groupValue = String(alert[this.groupBy as keyof EventRecord] || 'Unknown');
        
        if (groupValue && result[groupValue] && result[groupValue][alertDateStr] !== undefined) {
          // Directly increment if the exact date exists
          result[groupValue][alertDateStr] += 1;
        } else if (groupValue && result[groupValue]) {
          // Find closest date if exact date not in our range
          const closestDate = this.findClosestDate(alertDateStr, allDates);
          if (closestDate) {
            result[groupValue][closestDate] += 1;
          }
        }
      }
    });
    
    // Filter out groups with minimal data
    const groupSums: { group: string, sum: number }[] = [];
    Object.entries(result).forEach(([group, dateCounts]) => {
      const sum = Object.values(dateCounts).reduce((acc, val) => acc + val, 0);
      groupSums.push({ group, sum });
    });
    
    groupSums.sort((a, b) => b.sum - a.sum);
    
    if (groupSums.length > 0) {
      const largestSum = groupSums[0].sum;
      const threshold = largestSum * 0.1;
      
      const mainGroups = groupSums.filter(item => item.sum >= threshold);
      const smallGroups = groupSums.filter(item => item.sum < threshold);
      
      if (smallGroups.length > 0) {
        // Combine small groups into "Other"
        const otherCounts: Record<string, number> = {};
        allDates.forEach(date => {
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
  
  // Find the closest date in an array of date strings
  private findClosestDate(targetDateStr: string, dates: string[]): string | undefined {
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
  
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}