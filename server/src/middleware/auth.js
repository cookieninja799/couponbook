// server/src/middleware/auth.js   ← now pure ESM
import 'dotenv/config';
import jwt        from 'jsonwebtoken';
import jwkToPem   from 'jwk-to-pem';
import axios      from 'axios';

const region     = process.env.AWS_REGION;
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const issuer     = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

let pems = null;                               // cached after first call
async function getPems () {
  if (pems) return pems;
  const { data } = await axios.get(`${issuer}/.well-known/jwks.json`);
  pems = Object.fromEntries(
    data.keys.map(k => [k.kid, jwkToPem(k)])
  );
  return pems;
}

/**
 * Express middleware – verifies a Cognito-issued JWT.
 * On success sets req.user = decoded payload, else 401.
 */
export default function verifyJwt () {
  return async (req, res, next) => {
    try {
      /* 1️⃣ extract token */
      const token = (req.headers.authorization || '').replace(/^Bearer /i, '');
      if (!token) return res.status(401).json({ message: 'Token required' });

      /* 2️⃣ pick matching PEM */
      const decodedHead = jwt.decode(token, { complete: true });
      if (!decodedHead) throw new Error('Token malformed');
      const pem = (await getPems())[decodedHead.header.kid];
      if (!pem) throw new Error('Unknown kid');

      /* 3️⃣ verify */
      jwt.verify(token, pem, { issuer }, (err, payload) => {
        if (err) return res.status(401).json({ message: err.message });
        req.user = payload;
        next();
      });
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  };
}
