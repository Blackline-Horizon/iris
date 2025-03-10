import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterOptions } from '../dashboard-data.service';

@Component({
  selector: 'app-dashboard-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-filters.component.html',
  styleUrls: ['./dashboard-filters.component.css']
})
export class DashboardFiltersComponent implements OnInit {
  @Input() filterOptions: FilterOptions | null = null;
  @Input() dashboardType: 'map' | 'global' | 'report' = 'global';
  @Input() compact: boolean = false; // Input for compact mode
  @Input() hideResetButton: boolean = false; // Input to hide reset button
  @Input() set appliedFilters(filters: any) {
    this._appliedFilters = { ...filters };
    // Initialize selected continents based on countries
    if (filters.countries && filters.countries.length > 0) {
      this.selectedContinents = [];
      const eu = this.filterOptions?.countries?.EU || [];
      const na = this.filterOptions?.countries?.['North America'] || [];
      const other = this.filterOptions?.countries?.Other || [];
      
      const hasEU = filters.countries.some((country: string) => eu.includes(country));
      const hasNA = filters.countries.some((country: string) => na.includes(country));
      const hasOther = filters.countries.some((country: string) => other.includes(country));
      
      if (hasEU) this.selectedContinents.push('EU');
      if (hasNA) this.selectedContinents.push('North America');
      if (hasOther) this.selectedContinents.push('Other');
    }
  }
  get appliedFilters() {
    return this._appliedFilters;
  }
  
  @Output() filtersChanged = new EventEmitter<any>();
  @Output() applyFilterClicked = new EventEmitter<any>();
  @Output() resetFiltersClicked = new EventEmitter<void>();
  
  private _appliedFilters: any = {
    sensorTypes: [],
    industries: [],
    eventTypes: [],
    resolutionReasons: [],
    deviceTypes: [],
    countries: [],
    startDate: '',
    endDate: ''
  };
  
  selectedContinents: string[] = [];
  availableCountries: string[] = [];
  
  // Track which accordion sections are open
  isFilterGroupOpen: {[key: string]: boolean} = {
    sensorType: false,
    industry: false,
    eventType: false,
    resolutionReason: false,
    deviceType: false,
    continentCountry: false,
    dateRange: false
  };
  
  constructor() {}
  
  ngOnInit(): void {
    // Do not pre-select all continents and countries by default
    this.updateAvailableCountries();
  }
  
  toggleFilterGroup(group: string): void {
    this.isFilterGroupOpen[group] = !this.isFilterGroupOpen[group];
  }
  
  // Helpers for HTML template
  isInFilterArray(arrayName: string, value: string): boolean {
    return this._appliedFilters[arrayName].includes(value);
  }

  toggleAllSensorTypes(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.toggleAllOptions('sensorTypes', target.checked);
  }

  toggleAllIndustries(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.toggleAllOptions('industries', target.checked);
  }

  toggleAllEventTypes(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.toggleAllOptions('eventTypes', target.checked);
  }

  toggleAllResolutionReasons(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.toggleAllOptions('resolutionReasons', target.checked);
  }

  toggleAllDeviceTypes(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.toggleAllOptions('deviceTypes', target.checked);
  }

  toggleAllContinents(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.toggleAllOptions('continents', target.checked);
  }

  toggleAllCountries(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.toggleAllOptions('countries', target.checked);
  }
  
  toggleAllOptions(field: string, selected: boolean): void {
    if (!this.filterOptions) return;
    
    switch (field) {
      case 'sensorTypes':
        this._appliedFilters.sensorTypes = selected ? [...this.filterOptions.sensorTypes] : [];
        break;
      case 'industries':
        this._appliedFilters.industries = selected ? [...this.filterOptions.industries] : [];
        break;
      case 'eventTypes':
        this._appliedFilters.eventTypes = selected ? [...this.filterOptions.eventTypes] : [];
        break;
      case 'resolutionReasons':
        this._appliedFilters.resolutionReasons = selected ? [...this.filterOptions.resolutionReasons] : [];
        break;
      case 'deviceTypes':
        this._appliedFilters.deviceTypes = selected ? [...this.filterOptions.deviceTypes] : [];
        break;
      case 'continents':
        this.selectedContinents = selected ? ['EU', 'North America', 'Other'] : [];
        this.updateAvailableCountries();
        break;
      case 'countries':
        this._appliedFilters.countries = selected ? [...this.availableCountries] : [];
        break;
    }
    
    this.filtersChanged.emit(this._appliedFilters);
  }
  
  toggleContinent(continent: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const isChecked = target.checked;
    
    if (isChecked) {
      if (!this.selectedContinents.includes(continent)) {
        this.selectedContinents.push(continent);
      }
    } else {
      const index = this.selectedContinents.indexOf(continent);
      if (index > -1) {
        this.selectedContinents.splice(index, 1);
      }
      
      // Remove countries from this continent
      if (this.filterOptions?.countries) {
        const continentCountries = this.filterOptions.countries[continent as keyof typeof this.filterOptions.countries] || [];
        this._appliedFilters.countries = this._appliedFilters.countries.filter(
          (country: string) => !continentCountries.includes(country)
        );
      }
    }
    
    this.updateAvailableCountries();
    this.filtersChanged.emit(this._appliedFilters);
  }
  
  isContinentSelected(continent: string): boolean {
    return this.selectedContinents.includes(continent);
  }
  
  updateAvailableCountries(): void {
    if (!this.filterOptions?.countries) return;
    
    this.availableCountries = [];
    
    if (this.selectedContinents.includes('EU')) {
      this.availableCountries = [...this.availableCountries, ...this.filterOptions.countries.EU];
    }
    
    if (this.selectedContinents.includes('North America')) {
      this.availableCountries = [...this.availableCountries, ...this.filterOptions.countries['North America']];
    }
    
    if (this.selectedContinents.includes('Other')) {
      this.availableCountries = [...this.availableCountries, ...this.filterOptions.countries.Other];
    }
  }
  
  applyFilters(): void {
    const filters = { ...this._appliedFilters };
    filters.continents = [...this.selectedContinents];
    this.applyFilterClicked.emit(filters);
  }
  
  resetFilters(): void {
    this._appliedFilters = {
      sensorTypes: [],
      industries: [],
      eventTypes: [],
      resolutionReasons: [],
      deviceTypes: [],
      countries: [],
      startDate: '',
      endDate: ''
    };
    this.selectedContinents = [];
    this.updateAvailableCountries();
    this.resetFiltersClicked.emit();
  }
  
  areAllSelected(field: string): boolean {
    if (!this.filterOptions) return false;
    
    switch(field) {
      case 'sensorTypes':
        return this._appliedFilters.sensorTypes.length === this.filterOptions.sensorTypes.length;
      case 'industries':
        return this._appliedFilters.industries.length === this.filterOptions.industries.length;
      case 'eventTypes':
        return this._appliedFilters.eventTypes.length === this.filterOptions.eventTypes.length;
      case 'resolutionReasons':
        return this._appliedFilters.resolutionReasons.length === this.filterOptions.resolutionReasons.length;
      case 'deviceTypes':
        return this._appliedFilters.deviceTypes.length === this.filterOptions.deviceTypes.length;
      case 'continents':
        return this.selectedContinents.length === 3; // EU, NA, Other
      case 'countries':
        return this._appliedFilters.countries.length === this.availableCountries.length && this.availableCountries.length > 0;
      default:
        return false;
    }
  }

  toggleOption(array: string[], item: string): void {
    const index = array.indexOf(item);
    if (index === -1) {
      array.push(item);
    } else {
      array.splice(index, 1);
    }
    this.filtersChanged.emit(this._appliedFilters);
  }
}