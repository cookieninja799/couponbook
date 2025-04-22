// src/services/authService.js
import { UserManager } from 'oidc-client-ts';

const cognitoAuthConfig = {
    authority: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_O1hbHZsSq',
    client_id: '71mh713mljkcg4jftbcj85e24f',
    redirect_uri: 'http://localhost:8080/callback',
    response_type: 'code',
    scope: "email openid phone"
};

export const userManager = new UserManager(cognitoAuthConfig);

export async function signIn() {
    try {
      await userManager.signinRedirect();
    } catch (e) {
      console.error('Sign-in failed', e);
    }
}
  

export function signOut() {
    const clientId = "71mh713mljkcg4jftbcj85e24f";
    const logoutUri = "https://d84l1y8p4kdic.cloudfront.net/";
    const cognitoDomain = "https://us-east-1o1hbhzssq.auth.us-east-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  }
