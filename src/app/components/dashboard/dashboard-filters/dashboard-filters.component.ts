// /Users/shanzi/iris/iris/src/app/components/dashboard/dashboard-filters/dashboard-filters.component.ts
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
    // Initialize available countries based on selected continents
    this.updateAvailableCountries();
    
    // Open first filter group by default to improve UX
    this.isFilterGroupOpen['sensorType'] = true;
  }
  
  toggleFilterGroup(group: string): void {
    this.isFilterGroupOpen[group] = !this.isFilterGroupOpen[group];
  }
  
  // Helpers for HTML template
  isInFilterArray(arrayName: string, value: string): boolean {
    return Array.isArray(this._appliedFilters[arrayName]) && 
           this._appliedFilters[arrayName].includes(value);
  }

  toggleAllSensorTypes(event: Event): void {
    event.preventDefault(); // Prevent event bubbling
    const shouldSelect = !this.areAllSelected('sensorTypes');
    this.toggleAllOptions('sensorTypes', shouldSelect);
  }

  toggleAllIndustries(event: Event): void {
    event.preventDefault(); // Prevent event bubbling
    const shouldSelect = !this.areAllSelected('industries');
    this.toggleAllOptions('industries', shouldSelect);
  }

  toggleAllEventTypes(event: Event): void {
    event.preventDefault(); // Prevent event bubbling
    const shouldSelect = !this.areAllSelected('eventTypes');
    this.toggleAllOptions('eventTypes', shouldSelect);
  }

  toggleAllResolutionReasons(event: Event): void {
    event.preventDefault(); // Prevent event bubbling
    const shouldSelect = !this.areAllSelected('resolutionReasons');
    this.toggleAllOptions('resolutionReasons', shouldSelect);
  }

  toggleAllDeviceTypes(event: Event): void {
    event.preventDefault(); // Prevent event bubbling
    const shouldSelect = !this.areAllSelected('deviceTypes');
    this.toggleAllOptions('deviceTypes', shouldSelect);
  }

  toggleAllCountries(event: Event): void {
    event.preventDefault(); // Prevent event bubbling
    const shouldSelect = !this.areAllSelected('countries');
    this.toggleAllOptions('countries', shouldSelect);
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
    const isChecked = (event.target as HTMLInputElement).checked;
    
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
    
    if (this.selectedContinents.includes('EU') && Array.isArray(this.filterOptions.countries.EU)) {
      this.availableCountries = [...this.availableCountries, ...this.filterOptions.countries.EU];
    }
    
    if (this.selectedContinents.includes('North America') && 
        Array.isArray(this.filterOptions.countries['North America'])) {
      this.availableCountries = [...this.availableCountries, ...this.filterOptions.countries['North America']];
    }
    
    if (this.selectedContinents.includes('Other') && Array.isArray(this.filterOptions.countries.Other)) {
      this.availableCountries = [...this.availableCountries, ...this.filterOptions.countries.Other];
    }
    
    // Remove duplicates
    this.availableCountries = [...new Set(this.availableCountries)];
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
        return Array.isArray(this._appliedFilters.sensorTypes) && 
               Array.isArray(this.filterOptions.sensorTypes) && 
               this._appliedFilters.sensorTypes.length === this.filterOptions.sensorTypes.length &&
               this.filterOptions.sensorTypes.length > 0;
      case 'industries':
        return Array.isArray(this._appliedFilters.industries) && 
               Array.isArray(this.filterOptions.industries) && 
               this._appliedFilters.industries.length === this.filterOptions.industries.length &&
               this.filterOptions.industries.length > 0;
      case 'eventTypes':
        return Array.isArray(this._appliedFilters.eventTypes) && 
               Array.isArray(this.filterOptions.eventTypes) && 
               this._appliedFilters.eventTypes.length === this.filterOptions.eventTypes.length &&
               this.filterOptions.eventTypes.length > 0;
      case 'resolutionReasons':
        return Array.isArray(this._appliedFilters.resolutionReasons) && 
               Array.isArray(this.filterOptions.resolutionReasons) && 
               this._appliedFilters.resolutionReasons.length === this.filterOptions.resolutionReasons.length &&
               this.filterOptions.resolutionReasons.length > 0;
      case 'deviceTypes':
        return Array.isArray(this._appliedFilters.deviceTypes) && 
               Array.isArray(this.filterOptions.deviceTypes) && 
               this._appliedFilters.deviceTypes.length === this.filterOptions.deviceTypes.length &&
               this.filterOptions.deviceTypes.length > 0;
      case 'continents':
        return this.selectedContinents.length === 3; // EU, NA, Other
      case 'countries':
        return Array.isArray(this._appliedFilters.countries) && 
               this._appliedFilters.countries.length === this.availableCountries.length && 
               this.availableCountries.length > 0;
      default:
        return false;
    }
  }

  toggleOption(array: string[], item: string): void {
    if (!Array.isArray(array)) {
      array = [];
    }
    
    const index = array.indexOf(item);
    if (index === -1) {
      array.push(item);
    } else {
      array.splice(index, 1);
    }
    this.filtersChanged.emit(this._appliedFilters);
  }
}