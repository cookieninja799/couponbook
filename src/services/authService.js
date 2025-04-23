// src/services/authService.js
import { UserManager } from 'oidc-client-ts';

// Dynamically build URIs based on current origin
const origin = window.location.origin;
const redirectUri = `${origin}/callback`;
const logoutUri = origin;

const cognitoAuthConfig = {
  authority: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_O1hbHZsSq',
  client_id: '71mh713mljkcg4jftbcj85e24f',
  redirect_uri: redirectUri,
  post_logout_redirect_uri: logoutUri,
  response_type: 'code',
  scope: 'openid email phone'
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
  const cognitoDomain = 'https://us-east-1o1hbhzssq.auth.us-east-1.amazoncognito.com';
  const clientId = cognitoAuthConfig.client_id;
  // Redirect to Cognito logout endpoint with dynamic post-logout uri
  window.location.href =
    `${cognitoDomain}/logout?client_id=${clientId}` +
    `&logout_uri=${encodeURIComponent(logoutUri)}`;
}
