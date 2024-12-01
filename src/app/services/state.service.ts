import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

export enum UserSession {
  USERNAME = 'username',
  USER_ID = 'userId',
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private userDataSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private router: Router) {
    this.loadState();
  }

  private loadState() {
    const username = localStorage.getItem(UserSession.USERNAME);
    const userId = localStorage.getItem(UserSession.USER_ID);

    if (username && userId) {
      this.userDataSubject.next({ username, userId });
    } else {
      this.userDataSubject.next(null);
    }
  }

  setUserData(username: string, userId: string) {
    localStorage.setItem(UserSession.USERNAME, username);
    localStorage.setItem(UserSession.USER_ID, userId);
    this.userDataSubject.next({ username, userId });
  }

  clearUserData() {
    localStorage.removeItem(UserSession.USERNAME);
    localStorage.removeItem(UserSession.USER_ID);
    this.userDataSubject.next(null);
    this.router.navigate(['/login']);
  }

  getUserData() {
    return this.userDataSubject.asObservable();
  }
}
