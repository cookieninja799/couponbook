// tests/debug-cognito-token.mjs
//
// Quick script to:
//  1) Decode a Cognito JWT
//  2) Verify it against the Cognito JWKS (same flow as server/src/middleware/auth.js)
//  3) Call your local API with the token and log the result
//
// Usage:
//  AWS_REGION=us-east-1 \
//  COGNITO_USER_POOL_ID=us-east-1_O1hbHZsSq \
//  TEST_JWT="eyJraWQiOi..." \
//  TEST_COUPON_ID="161e1240-5a4e-4f00-ad9d-fcd9c311fca9" \
//  TEST_API_BASE="http://localhost:8080/api/v1" \
//  node tests/debug-cognito-token.mjs

import 'dotenv/config';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

// ---------- ENV + constants ----------
const {
  AWS_REGION,
  COGNITO_USER_POOL_ID,
  TEST_JWT,
  TEST_COUPON_ID,
  TEST_API_BASE,
} = process.env;

const API_BASE = TEST_API_BASE || 'http://localhost:8080/api/v1';

if (!TEST_JWT) {
  console.error('❌ TEST_JWT env var is required.');
  console.error('   Example: TEST_JWT="eyJraWQiOi..." node tests/debug-cognito-token.mjs');
  process.exit(1);
}

if (!AWS_REGION || !COGNITO_USER_POOL_ID) {
  console.error('❌ AWS_REGION and COGNITO_USER_POOL_ID env vars are required.');
  console.error('   They must match what your server uses in server/src/middleware/auth.js');
  process.exit(1);
}

const issuer = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;

// ---------- Helper: build PEMs from JWKS ----------
async function getPems() {
  console.log(`🔑 Fetching JWKS from: ${issuer}/.well-known/jwks.json`);
  const { data } = await axios.get(`${issuer}/.well-known/jwks.json`);
  const pems = Object.fromEntries(
    data.keys.map((k) => [k.kid, jwkToPem(k)])
  );
  console.log(`✅ Loaded ${Object.keys(pems).length} keys from JWKS`);
  return pems;
}

// ---------- Step 1: decode token ----------
function logDecodedToken(token) {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded) {
    console.error('❌ Could not decode TEST_JWT. Is it a valid JWT string?');
    process.exit(1);
  }

  console.log('🧾 Decoded JWT header:', JSON.stringify(decoded.header, null, 2));
  console.log('🧾 Decoded JWT payload:', JSON.stringify(decoded.payload, null, 2));
  return decoded;
}

// ---------- Step 2: verify token (like auth.js) ----------
async function verifyToken(token, decodedHead, pems) {
  const kid = decodedHead.header.kid;
  const pem = pems[kid];

  if (!pem) {
    console.error('❌ No matching key (kid) found in JWKS. kid =', kid);
    throw new Error('Unknown kid');
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, pem, { issuer }, (err, payload) => {
      if (err) {
        console.error('❌ jwt.verify error:', err.message);
        return reject(err);
      }
      console.log('✅ Token verified OK against Cognito JWKS');
      console.log('👤 Verified payload:', JSON.stringify(payload, null, 2));
      resolve(payload);
    });
  });
}

// ---------- Step 3: hit your API with the token ----------
async function testApiCall(token) {
  if (!TEST_COUPON_ID) {
    console.log('⚠️  TEST_COUPON_ID not set; skipping redeem call.');
    console.log('    Set TEST_COUPON_ID to a real coupon UUID to exercise /coupons/:id/redeem');
    return;
  }

  const url = `${API_BASE}/coupons/${TEST_COUPON_ID}/redeem`;
  console.log(`🌐 Calling: POST ${url}`);

  try {
    const res = await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true, // we want to see non-2xx too
      }
    );

    console.log('📡 Response status:', res.status);
    console.log('📡 Response data:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('❌ Request failed with response:');
      console.error('   status:', err.response.status);
      console.error('   data:', err.response.data);
    } else {
      console.error('❌ Request error:', err.message);
    }
  }
}

// ---------- Main ----------
(async () => {
  try {
    console.log('==============================');
    console.log('🔍 Step 1: Decode TEST_JWT');
    console.log('==============================');
    const decoded = logDecodedToken(TEST_JWT);

    console.log('\n==============================');
    console.log('🔐 Step 2: Verify Token via JWKS (auth.js-style)');
    console.log('==============================');
    const pems = await getPems();
    await verifyToken(TEST_JWT, decoded, pems);

    console.log('\n==============================');
    console.log('🌐 Step 3: Call API with this token');
    console.log('==============================');
    await testApiCall(TEST_JWT);

    console.log('\n✅ Done. Compare these logs with what the server prints in /middleware/auth.js.');
  } catch (err) {
    console.error('\n💥 Script error:', err.message);
    process.exit(1);
  }
})();
