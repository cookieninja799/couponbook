// server/src/routes/users.js
import express from 'express';
import { CognitoIdentityProviderClient, SignUpCommand, InitiateAuthCommand, } from '@aws-sdk/client-cognito-identity-provider';
import { db } from '../db.js';
// 👇 Pull Drizzle tables straight from TypeScript
import { user } from '../schema.js'; // important: .ts extension with ts-node/esm
const router = express.Router();
const cognito = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
});
// POST /api/v1/users/signup
router.post('/signup', async (req, res) => {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    try {
        // 1) Create user in Cognito
        const { UserSub } = await cognito.send(new SignUpCommand({
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: email,
            Password: password,
            UserAttributes: [{ Name: 'email', Value: email }],
        }));
        // 2) Persist to Postgres (Drizzle)
        const fallbackName = typeof name === 'string' && name.trim() ? name.trim() : email.split('@')[0];
        const [newUser] = await db
            .insert(user)
            .values({
            cognitoSub: UserSub, // matches schema camelCase
            email,
            name: fallbackName, // avoid NULL; column is notNull()
            role: 'customer', // enum: admin | merchant | customer
        })
            .returning();
        return res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            cognito_sub: UserSub,
        });
    }
    catch (err) {
        console.error('Signup error:', err);
        if (err && err.name === 'UsernameExistsException') {
            return res.status(409).json({ error: 'User already exists' });
        }
        return res.status(500).json({ error: err?.message || 'Server error' });
    }
});
// POST /api/v1/users/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    try {
        const { AuthenticationResult } = await cognito.send(new InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
            },
        }));
        return res.json({
            idToken: AuthenticationResult?.IdToken,
            accessToken: AuthenticationResult?.AccessToken,
            refreshToken: AuthenticationResult?.RefreshToken,
            expiresIn: AuthenticationResult?.ExpiresIn,
        });
    }
    catch (err) {
        console.error('Cognito login error:', err);
        switch (err?.name) {
            case 'NotAuthorizedException':
                return res.status(401).json({ error: 'Invalid email or password' });
            case 'UserNotConfirmedException':
                return res.status(403).json({ error: 'User not confirmed' });
            default:
                return res.status(500).json({ error: err?.message || 'Server error' });
        }
    }
});
export default router;
