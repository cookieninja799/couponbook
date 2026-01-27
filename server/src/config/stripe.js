import Stripe from 'stripe';

/**
 * Validates Stripe environment variables and initializes Stripe client
 * Throws error on startup if required env vars are missing or invalid
 */
function validateStripeEnv() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const errors = [];

  // Validate secret key format
  if (!secretKey) {
    errors.push('STRIPE_SECRET_KEY is missing');
  } else if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
    errors.push('STRIPE_SECRET_KEY must start with "sk_test_" or "sk_live_"');
  }

  // Validate publishable key format
  if (!publishableKey) {
    errors.push('STRIPE_PUBLISHABLE_KEY is missing');
  } else if (!publishableKey.startsWith('pk_test_') && !publishableKey.startsWith('pk_live_')) {
    errors.push('STRIPE_PUBLISHABLE_KEY must start with "pk_test_" or "pk_live_"');
  }

  // Validate webhook secret format
  if (!webhookSecret) {
    errors.push('STRIPE_WEBHOOK_SECRET is missing');
  } else if (!webhookSecret.startsWith('whsec_')) {
    errors.push('STRIPE_WEBHOOK_SECRET must start with "whsec_"');
  }

  // Ensure keys match (both test or both live)
  if (secretKey && publishableKey) {
    const secretIsTest = secretKey.startsWith('sk_test_');
    const publishableIsTest = publishableKey.startsWith('pk_test_');
    if (secretIsTest !== publishableIsTest) {
      errors.push('STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY must both be test keys or both be live keys');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Stripe configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }

  return { secretKey, publishableKey, webhookSecret };
}

// Validate and initialize on module load
let stripe;
let stripeConfig;

try {
  stripeConfig = validateStripeEnv();
  stripe = new Stripe(stripeConfig.secretKey, {
    apiVersion: '2024-12-18.acacia',
  });
  console.log('✅ Stripe client initialized successfully');
} catch (error) {
  console.error('❌ Stripe configuration error:', error.message);
  throw error;
}

export { stripe, stripeConfig };
export default stripe;
