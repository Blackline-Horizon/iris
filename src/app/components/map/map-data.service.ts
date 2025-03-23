import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout, tap } from 'rxjs/operators';
import { EventRecord, FilterOptions, DashboardResponse } from '../dashboard/dashboard-data.service';

@Injectable({
  providedIn: 'root'
})
export class MapDataService {
  private apiBaseUrl = 'http://127.0.0.1:3001';
  
  constructor(private http: HttpClient) {}
  
  /**
   * Get map data with applied filters
   * Reuses the same API endpoint as the dashboard for consistency
   */
  getMapData(filters?: {
    sensorTypes?: string[];
    industries?: string[];
    countries?: string[];
    continents?: string[];
    startDate?: string;
    endDate?: string;
  }): Observable<DashboardResponse> {
    console.log('Map data service requesting data with filters:', filters);
    
    // Create request body in the format expected by the API
    const requestBody: any = {};
    
    if (filters) {
      if (filters.sensorTypes && filters.sensorTypes.length) {
        requestBody.sensor_type = filters.sensorTypes;
      }
      
      if (filters.industries && filters.industries.length) {
        requestBody.industry = filters.industries;
      }
      
      if (filters.countries && filters.countries.length) {
        requestBody.country = filters.countries;
      }
      
      if (filters.continents && filters.continents.length) {
        requestBody.continent = filters.continents;
      }
      
      // 添加日期过滤器
      if (filters.startDate) {
        requestBody.start_date = filters.startDate;
      }
      
      if (filters.endDate) {
        requestBody.end_date = filters.endDate;
      }
    }
    
    // 增加超时处理和错误捕获
    return this.http.post<DashboardResponse>(`${this.apiBaseUrl}/dashboard_data`, requestBody)
      .pipe(
        timeout(30000), // 30秒超时
        tap(data => console.log('Map data received:', data ? 'Success' : 'Empty')),
        catchError(error => {
          console.error('Error fetching map data:', error);
          // 返回一个带有错误信息的空响应
          return of({
            alerts: [],
            metrics: {
              total_alerts: 0,
              avg_alerts_per_day: 0,
              distribution_data: {
                sensor_type: {},
                resolution_reason: {},
                device_type: {},
                industry: {},
                event_type: {}
              }
            },
            time_series: [],
            error: error.message || 'Failed to fetch data'
          } as DashboardResponse);
        })
      );
  }
}