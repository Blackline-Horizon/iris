// src/app/services/state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private stateKey = 'appState'; // Key to store state in localStorage

  private stateSubject: BehaviorSubject<any> = new BehaviorSubject<any>({});
  state$: Observable<any> = this.stateSubject.asObservable();

  constructor() {
    this.loadState(); // Load state from localStorage on service initialization
  }

  private loadState() {
    const savedState = localStorage.getItem(this.stateKey);
    if (savedState) {
      this.stateSubject.next(JSON.parse(savedState)); // Load from localStorage
    }
  }

  private updateState(newState: any) {
    localStorage.setItem(this.stateKey, JSON.stringify(newState)); // Save to localStorage
    this.stateSubject.next(newState); // Emit the updated state to subscribers
  }

  // Set state for a given key
  setState(key: string, value: any) {
    const currentState = this.stateSubject.getValue();
    const updatedState = { ...currentState, [key]: value };

    // Clear state if 'isAuthenticated' is set to false
    if (key === 'isAuthenticated' && value === false) {
      this.clearState(); // Clears all state when the user logs out
    } else {
      this.updateState(updatedState); // Update the state otherwise
    }
  }

  // Get a specific value from the state by key
  getState(key: string) {
    return this.stateSubject.getValue()[key];
  }

  // Clear the entire state
  clearState() {
    localStorage.removeItem(this.stateKey); // Remove from localStorage
    this.stateSubject.next({}); // Reset state in BehaviorSubject
  }
}
