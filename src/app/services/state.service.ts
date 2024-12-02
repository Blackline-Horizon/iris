import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private stateKey = 'appState';

  private stateSubject: BehaviorSubject<any> = new BehaviorSubject<any>({});
  state$: Observable<any> = this.stateSubject.asObservable();

  constructor() {
    this.loadState();
  }

  private loadState() {
    const savedState = localStorage.getItem(this.stateKey);
    if (savedState) {
      this.stateSubject.next(JSON.parse(savedState));
    }
  }

  private updateState(newState: any) {
    localStorage.setItem(this.stateKey, JSON.stringify(newState));
    this.stateSubject.next(newState);
  }

  setState(key: string, value: any) {
    const currentState = this.stateSubject.getValue();
    const updatedState = { ...currentState, [key]: value };

    if (key === 'isAuthenticated' && value === false) {
      this.clearState();
    } else {
      this.updateState(updatedState);
    }
  }

  getState(key: string) {
    return this.stateSubject.getValue()[key];
  }

  clearState() {
    localStorage.removeItem(this.stateKey);
    this.stateSubject.next({});
  }
}
