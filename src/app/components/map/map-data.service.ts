import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  }): Observable<DashboardResponse> {
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
    }
    
    // Use the existing dashboard_data endpoint with POST method
    return this.http.post<DashboardResponse>(`${this.apiBaseUrl}/dashboard_data`, requestBody);
  }
}