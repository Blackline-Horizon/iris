// /Users/shanzi/iris/iris/src/app/components/dashboard/dashboard-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment } from '../../../environments/environments.prod'

export interface EventRecord {
  id: number;
  date_created: string;
  name?: string;
  assigned_user?: string;
  resolution_reason: string;
  sensor_type: string;
  event_type: string;
  industry: string;
  device_type: string;
  current_status?: string;
  country: string;  // Changed from country_name to match backend
  latitude?: number; // Changed from lat
  longitude?: number; // Changed from lng
  [key: string]: any; // Index signature to allow accessing properties by string
}

export interface FilterOptions {
  sensorTypes: string[];
  industries: string[];
  eventTypes: string[];
  resolutionReasons: string[];
  deviceTypes: string[];
  countries: {
    EU: string[];
    'North America': string[];
    Other: string[];
  };
}

export interface DashboardResponse {
  alerts: EventRecord[];
  metrics: {
    total_alerts: number;
    avg_alerts_per_day: number;
    distribution_data: {
      sensor_type: Record<string, number>;
      resolution_reason: Record<string, number>;
      device_type: Record<string, number>;
      industry: Record<string, number>;
      event_type: Record<string, number>;
      [key: string]: Record<string, number>; // Add index signature
    };
  };
  // Add time_series property
  time_series?: Array<{ date: string, value: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardDataService {
  private apiBaseUrl = environment.ATHENA;
  
  constructor(private http: HttpClient) {}

  getAlerts(filters?: {
    sensorTypes?: string[];
    industries?: string[];
    eventTypes?: string[];
    resolutionReasons?: string[];
    deviceTypes?: string[];
    countries?: string[];
    continents?: string[];
    startDate?: string;
    endDate?: string;
  }): Observable<DashboardResponse> {
    // Create request body in the format expected by the new API
    const requestBody: any = {};
    
    if (filters) {
      if (filters.sensorTypes && filters.sensorTypes.length) {
        requestBody.sensor_type = filters.sensorTypes;
      }
      
      if (filters.industries && filters.industries.length) {
        requestBody.industry = filters.industries;
      }
      
      if (filters.eventTypes && filters.eventTypes.length) {
        requestBody.event_type = filters.eventTypes;
      }
      
      if (filters.resolutionReasons && filters.resolutionReasons.length) {
        requestBody.resolution_reason = filters.resolutionReasons;
      }
      
      if (filters.deviceTypes && filters.deviceTypes.length) {
        requestBody.device_type = filters.deviceTypes;
      }
      
      if (filters.countries && filters.countries.length) {
        requestBody.country = filters.countries;
      }
      
      if (filters.continents && filters.continents.length) {
        requestBody.continent = filters.continents;
      }
      
      if (filters.startDate) {
        requestBody.start_date = new Date(filters.startDate);
      }
      
      if (filters.endDate) {
        requestBody.end_date = new Date(filters.endDate);
      }
    }
    
    // Use the new dashboard_data endpoint with POST method
    return this.http.post<DashboardResponse>(`${this.apiBaseUrl}dashboard_data`, requestBody);
  }

  // Add method for report data
  getReportData(filters: {
    resolutionReasons?: string[];
    deviceTypes?: string[];
    sensorTypes?: string[];
    eventTypes?: string[];
    industries?: string[];
    continents?: string[];
    countries?: string[];
    dateStart: Date;
    dateEnd: Date;
  }): Observable<any> {
    // Create request body in the format expected by the report_data API
    const requestBody: any = {
      date_start: filters.dateStart,
      date_end: filters.dateEnd
    };
    
    if (filters.resolutionReasons && filters.resolutionReasons.length) {
      requestBody.resolution_reason = filters.resolutionReasons;
    }
    
    if (filters.deviceTypes && filters.deviceTypes.length) {
      requestBody.device_type = filters.deviceTypes;
    }
    
    if (filters.sensorTypes && filters.sensorTypes.length) {
      requestBody.sensor_type = filters.sensorTypes;
    }
    
    if (filters.eventTypes && filters.eventTypes.length) {
      requestBody.event_type = filters.eventTypes;
    }
    
    if (filters.industries && filters.industries.length) {
      requestBody.industry = filters.industries;
    }
    
    if (filters.continents && filters.continents.length) {
      requestBody.continent = filters.continents;
    }
    
    if (filters.countries && filters.countries.length) {
      requestBody.country = filters.countries;
    }
    
    return this.http.post<any>(`${this.apiBaseUrl}report_data`, requestBody);
  }
}