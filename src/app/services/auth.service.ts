import { Injectable } from '@angular/core';
import { environment } from '../../environments/environments.local';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';
import { StateService } from './state.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userPool: CognitoUserPool;

  constructor(private stateService: StateService, private router: Router) {
    const poolData = {
      UserPoolId: environment.cognito.userPoolId,
      ClientId: environment.cognito.clientId,
    };
    this.userPool = new CognitoUserPool(poolData);
  }

  signUp(
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string
  ): Promise<any> {
    const attributes = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({
        Name: 'name',
        Value: `${firstName} ${lastName}`,
      }),
    ];

    return new Promise((resolve, reject) => {
      this.userPool.signUp(
        username,
        password,
        attributes,
        [],
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  login(username: string, password: string): Promise<any> {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: this.userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          this.stateService.setState('isAuthenticated', true);
          this.router.navigate(['/dashboard']);
          resolve(result);
        },
        onFailure: (err) => {
          this.stateService.setState('isAuthenticated', false);
          reject(err);
        },
      });
    });
  }

  logout(): void {
    const cognitoUser = this.userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
      this.stateService.setState('isAuthenticated', false);
      this.router.navigate(['/login']);
    }
  }

  confirmSignUp(username: string, confirmationCode: string): Promise<any> {
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: this.userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(confirmationCode, true, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  isAuthenticated(): boolean {
    const cognitoUser = this.userPool.getCurrentUser();
    return cognitoUser != null && cognitoUser.getSignInUserSession() != null;
  }
}
