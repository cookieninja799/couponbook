// api/[...slug].js
import serverlessExpress from '@vendia/serverless-express';
import app from '../server/src/index.js';    // <-- your existing Express app

export const config = {
  runtime: 'nodejs',                     // tell Vercel which Node to use
};

const handler = serverlessExpress({ app });

// every incoming request to /api/* gets routed here:
export default async function (req, res) {
  return handler(req, res);
}
