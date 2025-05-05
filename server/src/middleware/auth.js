// middleware/auth.js
require('dotenv').config();
const jwt       = require('jsonwebtoken');
const jwkToPem  = require('jwk-to-pem');
const axios     = require('axios');

const region      = process.env.AWS_REGION;
const userPoolId  = process.env.COGNITO_USER_POOL_ID;
const issuer      = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

let pems = null;                         //  ─┐  cached after 1st call
async function getPems () {              //  ─┘
  if (pems) return pems;                 // already cached
  const url = `${issuer}/.well-known/jwks.json`;
  const { data } = await axios.get(url);
  pems = Object.fromEntries(
    data.keys.map(k => [k.kid, jwkToPem(k)])
  );
  return pems;
}

/**
 * Express middleware ‑ verifies Cognito‑issued JWT, else 401.
 * Adds `req.user` = decoded payload when valid.
 */
module.exports = function verifyJwt () {
  return async (req, res, next) => {
    try {
      // 1 🏷 grab token
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace(/^Bearer /i, '');
      if (!token) return res.status(401).json({ message: 'Token required' });

      // 2 🔎 decode header -> find matching PEM
      const decodedHead = jwt.decode(token, { complete: true });
      if (!decodedHead) throw new Error('Token malformed');
      const pems = await getPems();
      const pem  = pems[decodedHead.header.kid];
      if (!pem)  throw new Error('Unknown kid');

      // 3 ✅ verify sig + issuer; (add audience if you like)
      jwt.verify(
        token,
        pem,
        { issuer },
        (err, payload) => {
          if (err) return res.status(401).json({ message: err.message });
          req.user = payload;            // make claims available downstream
          next();
        }
      );
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  };
};
