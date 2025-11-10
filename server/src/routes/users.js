// server/src/routes/users.js
import express from 'express';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { user } from '../schema.js';

const router = express.Router();

console.log('📦  users router loaded');

const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

// --- JWKS client (for verifying Cognito ID tokens) ---
// --- helpers ---
function asciiHyphenateRegion(r) {
  return (r || '').trim()
    // replace any non-ascii hyphen/dash with ascii '-'
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    // collapse doubles, strip spaces
    .replace(/\s+/g, '')
    .replace(/-+/g, '-');
}
const REGION = asciiHyphenateRegion(process.env.AWS_REGION);
if (process.env.AWS_REGION && process.env.AWS_REGION !== REGION) {
  console.warn(`📦  AWS_REGION normalized from "${process.env.AWS_REGION}" → "${REGION}"`);
}
const EXPECTED_ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`;

function makeJwksClient(issuer) {
  return jwksRsa({ jwksUri: `${issuer}/.well-known/jwks.json` });
}

function getKey(header, cb) {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) return cb(err);
    const signingKey = key.getPublicKey();
    cb(null, signingKey);
  });
}

// POST /api/v1/users/signup
router.post('/signup', async (req, res) => {
  console.log('📦  POST /api/v1/users/signup hit');
  const { email, password, name } = req.body || {};
  if (!email || !password) {
    console.log('📦  signup missing email or password');
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    console.log(`📦  signing up user in Cognito: ${email}`);
    const { UserSub } = await cognito.send(
      new SignUpCommand({
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: attrs,
      })
    );
    console.log(`📦  Cognito SignUp ok → sub=${UserSub}`);

    const fallbackName =
      typeof name === 'string' && name.trim() ? name.trim() : email.split('@')[0];

    const [newUser] = await db
      .insert(user)
      .values({
        cognitoSub: UserSub,
        email,
        name: fallbackName,
        role: 'customer',
      })
      .returning();

    console.log(`📦  inserted user row id=${newUser.id} for sub=${UserSub}`);
    console.log('📦  returning 201 with user basics');
    return res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      cognito_sub: UserSub,
    });
  } catch (err) {
    console.error('📦  Signup error:', err);
    if (err && err.name === 'UsernameExistsException') {
      console.log('📦  user already exists (409)');
      return res.status(409).json({ error: 'User already exists' });
    }
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
});

// POST /api/v1/users/login
router.post('/login', async (req, res) => {
  console.log('📦  POST /api/v1/users/login hit');
  const { email, password } = req.body || {};
  if (!email || !password) {
    console.log('📦  login missing email or password');
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    console.log(`📦  initiating Cognito auth for ${email}`);
    const { AuthenticationResult } = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: process.env.COGNITO_CLIENT_ID,
        AuthParameters: { USERNAME: email, PASSWORD: password },
      })
    );

    console.log('📦  Cognito login ok, returning tokens');
    return res.json({
      idToken: AuthenticationResult?.IdToken,
      accessToken: AuthenticationResult?.AccessToken,
      refreshToken: AuthenticationResult?.RefreshToken,
      expiresIn: AuthenticationResult?.ExpiresIn,
    });
  } catch (err) {
    console.error('📦  Cognito login error:', err);
    switch (err?.name) {
      case 'NotAuthorizedException':
        console.log('📦  401 invalid email or password');
        return res.status(401).json({ error: 'Invalid email or password' });
      case 'UserNotConfirmedException':
        console.log('📦  403 user not confirmed');
        return res.status(403).json({ error: 'User not confirmed' });
      default:
        return res.status(500).json({ error: err?.message || 'Server error' });
    }
  }
});

/**
 * POST /api/v1/users/sync
 * Use after hosted-UI callback: verifies the Cognito ID token (Bearer)
 * and UPSERTS the user into Postgres by cognitoSub.
 *
 * Headers:
 *   Authorization: Bearer <Cognito ID token>
 */
router.post('/sync', async (req, res) => {
  console.log('📦  POST /api/v1/users/sync hit');
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      console.log('📦  sync missing Bearer token (401)');
      return res.status(401).json({ error: 'Missing token' });
    }

    // 1) Decode unverified to learn issuer (iss) and kid
    const decodedUnverified = jwt.decode(token, { complete: true });
    const iss = decodedUnverified?.payload?.iss;
    const kid = decodedUnverified?.header?.kid;
    if (!iss || !kid) {
      console.log('📦  invalid token structure (no iss/kid)');
      return res.status(400).json({ error: 'Malformed token' });
    }
    // Guard: ensure the issuer matches our pool (prevents cross-pool tokens)
    if (iss !== EXPECTED_ISSUER) {
      console.warn(`📦  issuer mismatch. expected=${EXPECTED_ISSUER} got=${iss}`);
      return res.status(401).json({ error: 'Invalid token issuer' });
    }
    console.log(`📦  token issuer: ${iss} (kid=${kid})`);

    // 2) Build a JWKS client for this issuer dynamically
    const jwksClient = makeJwksClient(iss);
    const getKey = (header, cb) => {
      jwksClient.getSigningKey(header.kid, (err, key) => {
        if (err) return cb(err);
        cb(null, key.getPublicKey());
      });
    };

    // 3) Verify signature + issuer + audience
    const decoded = await new Promise((resolve, reject) =>
      jwt.verify(
        token,
        getKey,
        {
          algorithms: ['RS256'],
          issuer: iss,
          audience: process.env.COGNITO_CLIENT_ID, // must match your App Client ID
        },
        (e, d) => (e ? reject(e) : resolve(d))
      )
    )
    const sub = decoded.sub;
    const email = decoded.email || decoded['cognito:username'] || '';
    const preferred = decoded.name
    || [decoded.given_name, decoded.family_name].filter(Boolean).join(' ').trim()
    || decoded.preferred_username
    || '';
    const name = preferred || (email ? email.split('@')[0] : 'user');

    console.log(`📦  token ok → sub=${sub} email=${email} aud=${decoded.aud}`);

    const existing = await db.select().from(user).where(eq(user.cognitoSub, sub)).limit(1);
    let row = existing[0];

    if (!row) {
      console.log('📦  no user row found; inserting…');
      [row] = await db
        .insert(user)
        .values({ cognitoSub: sub, email, name, role: 'customer' })
        .returning();
      console.log(`📦  inserted user id=${row.id}`);
    } else {
      const patch = {};
      if (!row.email && email) patch.email = email;
      if (!row.name && name) patch.name = name;

      if (Object.keys(patch).length) {
        console.log(`📦  updating user id=${row.id} with patch=${JSON.stringify(patch)}`);
        [row] = await db.update(user).set(patch).where(eq(user.id, row.id)).returning();
      } else {
        console.log(`📦  user id=${row.id} already up-to-date`);
      }
    }

    console.log('📦  returning sync payload');
    return res.json({ id: row.id, email: row.email, cognito_sub: sub });
  } catch (err) {
    console.error('📦  users/sync error', err);
    return res.status(400).json({ error: 'Invalid or expired token' });
  }
});

export default router;
