// index.js  (at the repo root, next to package.json)
import serverless from 'serverless-http';
import app from './server/src/index.js';

export const handler = serverless(app);
