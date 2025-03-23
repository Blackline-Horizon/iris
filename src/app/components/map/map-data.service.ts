import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout, tap } from 'rxjs/operators';
import { EventRecord, FilterOptions, DashboardResponse } from '../dashboard/dashboard-data.service';

export interface MapPoint {
  id?: number;
  latitude: number;
  longitude: number;
  sensor_type?: string;
  industry?: string;
  country?: string;
  date_created?: string;
}

export interface MapCluster {
  latitude: number;
  longitude: number;
  point_count: number;
  sensor_type?: string;
}

export interface MapDataResponse {
  total_alerts: number;
  total_locations: number;
  points: MapPoint[];
  clusters: MapCluster[];
  use_clustering: boolean;
}

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapDataService {
  private apiBaseUrl = 'http://127.0.0.1:3001';
  
  constructor(private http: HttpClient) {}
  
  /**
   * Get map data with applied filters
   * Uses the optimized endpoint for map data when available
   */
  getMapData(filters?: {
    sensorTypes?: string[];
    industries?: string[];
    countries?: string[];
    continents?: string[];
    startDate?: string;
    endDate?: string;
  }, 
  viewport?: ViewportBounds,
  zoomLevel: number = 5
  ): Observable<DashboardResponse> {
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
      
      // Add date filters
      if (filters.startDate) {
        requestBody.start_date = filters.startDate;
      }
      
      if (filters.endDate) {
        requestBody.end_date = filters.endDate;
      }
    }
    
    // Add timeout handling and error catching
    return this.http.post<DashboardResponse>(`${this.apiBaseUrl}/dashboard_data`, requestBody)
      .pipe(
        timeout(30000), // 30 second timeout
        tap(data => console.log('Map data received:', data ? 'Success' : 'Empty')),
        catchError(error => {
          console.error('Error fetching map data:', error);
          // Return an empty response with error information
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