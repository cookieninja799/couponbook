// lambda.js
import serverlessExpress from '@vendia/serverless-express';
import app from './server/src/index.js';   // your existing Express app

// create the Lambda handler
export const handler = serverlessExpress({ app });
