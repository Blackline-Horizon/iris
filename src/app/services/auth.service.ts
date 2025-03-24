import { Injectable } from '@angular/core';
import { environment } from '../../environments/environments.prod';
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
      new CognitoUserAttribute({
        Name: 'given_name',
        Value: `${firstName}`,
      }),
      new CognitoUserAttribute({
        Name: 'family_name',
        Value: `${lastName}`,
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
            console.log(err);
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
          // Fetch user attributes after successful login
          cognitoUser.getUserAttributes((err, attributes) => {
            if (err) {
              reject(err);
              console.log(err);
            } else {
              // Ensure `attributes` is an array (it should be, but we handle any edge case)
              const userAttributes: CognitoUserAttribute[] = attributes || [];
              const email = this.getAttributeValue(
                userAttributes,
                'email'
              )
              // Extract firstName, lastName, and JWT token
              const firstName = this.getAttributeValue(
                userAttributes,
                'given_name'
              );
              const lastName = this.getAttributeValue(
                userAttributes,
                'family_name'
              );
              const uuid = this.getAttributeValue(userAttributes, 'sub')
              const jwtToken = result.getIdToken().getJwtToken();

              this.stateService.setState('isAuthenticated', true);
              this.stateService.setState('username', username);
              this.stateService.setState('firstName', firstName);
              this.stateService.setState('lastName', lastName);
              this.stateService.setState('email', email);
              this.stateService.setState('uuid', uuid);
              this.stateService.setState('jwtToken', jwtToken);

              this.router.navigate(['/dashboard']);
              resolve(result);
            }
          });
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
      this.stateService.clearState();
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

  private getAttributeValue(
    attributes: CognitoUserAttribute[],
    name: string
  ): string {
    const attribute = attributes.find((attr) => attr.Name === name);
    return attribute ? attribute.Value : '';
  }
}
