import express from 'express';
import jwt from 'jsonwebtoken';
import { CognitoIdentityProviderClient, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    try {
      // 1) Sign up in Cognito
      const { UserSub } = await cognito.send(
        new SignUpCommand({
          ClientId: process.env.COGNITO_CLIENT_ID,
          Username: email,
          Password: password,
          UserAttributes: [{ Name: 'email', Value: email }],
        })
      );
  
      // 2) Persist to your Postgres user table
      const [newUser] = await db
        .insert(users)
        .values({
          cognito_sub: UserSub,
          email,
          // you can set defaults for name/role in your schema or override here:
          name: null,
          role: 'user',
        })
        .returning();
  
      return res.status(201).json({ id: newUser.id, email, cognito_sub: UserSub });
    } catch (err) {
      console.error(err);
      if (err.name === 'UsernameExistsException') {
        return res.status(409).json({ error: 'User already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
  });

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const { AuthenticationResult } = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: process.env.COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })
    );

    // AuthenticationResult contains: IdToken, AccessToken, RefreshToken, ExpiresIn
    return res.json({
      idToken:   AuthenticationResult.IdToken,
      accessToken: AuthenticationResult.AccessToken,
      refreshToken: AuthenticationResult.RefreshToken,
      expiresIn: AuthenticationResult.ExpiresIn,
    });
  } catch (err) {
    console.error('Cognito login error', err);
    switch (err.name) {
      case 'NotAuthorizedException':
        return res.status(401).json({ error: 'Invalid email or password' });
      case 'UserNotConfirmedException':
        return res.status(403).json({ error: 'User not confirmed' });
      default:
        return res.status(500).json({ error: err.message });
    }
  }
});

export default router;
