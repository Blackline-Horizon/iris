import { Injectable } from '@angular/core';
import axios, { AxiosResponse } from 'axios';
import { environment } from '../../environments/environments.local';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor() { }

  // Method for GET Hermes
  getHermes(endpoint: string = '', params: Record<string, any> = {}, options:any = {}): Promise<AxiosResponse<any>> {
    return axios.get(environment.HERMES + endpoint, { params, ...options}) // Pass params as the second argument
      .then(response => response)
      .catch(error => {
        console.error(`Error fetching ${environment.HERMES + endpoint}`, error);
        throw error;
      });
  }

  // Method for POST Hermes
  postHermes(endpoint: string = '', data: Record<string, any> = {}): Promise<AxiosResponse<any>> {
    return axios.post(environment.HERMES + endpoint, data)
      .then(response => response)
      .catch(error => {
        console.error(`Error posting to ${environment.HERMES + endpoint}`, error);
        throw error;
      });
  }

    // Method for POST Hermes
    async postAsyncHermes(endpoint: string = '', data: Record<string, any> = {}): Promise<AxiosResponse<any>> {
      return axios.post(environment.HERMES + endpoint, data)
        .then(response => response)
        .catch(error => {
          console.error(`Error posting to ${environment.HERMES + endpoint}`, error);
          throw error;
        });
    }
  // Method for POST Hermes
  deleteHermes(endpoint: string = '', params: Record<string, any> = {}): Promise<AxiosResponse<any>> {
    return axios.delete(environment.HERMES + endpoint, {params})
      .then(response => response)
      .catch(error => {
        console.error(`Error deleting to ${environment.HERMES + endpoint}`, error);
        throw error;
      });
  }
}