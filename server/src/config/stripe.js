import Stripe from 'stripe';

/**
 * Validates Stripe environment variables and initializes Stripe client
 * Throws error on startup if required env vars are missing or invalid
 */
function validateStripeEnv() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeMode = process.env.STRIPE_MODE;

  const errors = [];

  // Validate STRIPE_MODE
  if (!stripeMode) {
    errors.push('STRIPE_MODE is missing (must be "test" or "live")');
  } else if (stripeMode !== 'test' && stripeMode !== 'live') {
    errors.push('STRIPE_MODE must be either "test" or "live"');
  }

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

  // Validate that STRIPE_MODE matches the key types
  if (stripeMode && secretKey) {
    const secretIsTest = secretKey.startsWith('sk_test_');
    const secretIsLive = secretKey.startsWith('sk_live_');
    
    if (stripeMode === 'test' && !secretIsTest) {
      errors.push('STRIPE_MODE is "test" but STRIPE_SECRET_KEY is not a test key');
    }
    if (stripeMode === 'live' && !secretIsLive) {
      errors.push('STRIPE_MODE is "live" but STRIPE_SECRET_KEY is not a live key');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Stripe configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }

  return { secretKey, publishableKey, webhookSecret, mode: stripeMode };
}

/**
 * Validates that a Stripe ID matches the current environment mode
 * @param {string} stripeId - The Stripe ID to validate (price_*, prod_*, etc.)
 * @param {string} idType - Type of ID for error messages (e.g., 'Price', 'Product')
 * @throws {Error} If the ID doesn't match the environment mode
 */
function validateStripeIdMode(stripeId, idType = 'Stripe ID') {
  if (!stripeId) return; // Allow null/undefined IDs
  
  const mode = stripeConfig?.mode;
  if (!mode) return; // Skip validation if mode not set (shouldn't happen after init)
  
  const isTestId = stripeId.includes('_test_');
  const isLiveId = !isTestId && (stripeId.startsWith('price_') || stripeId.startsWith('prod_') || stripeId.startsWith('plan_'));
  
  if (mode === 'live' && isTestId) {
    throw new Error(`${idType} "${stripeId}" is a test ID but STRIPE_MODE is "live". Cannot use test IDs in production.`);
  }
  
  if (mode === 'test' && isLiveId && !isTestId) {
    throw new Error(`${idType} "${stripeId}" appears to be a live ID but STRIPE_MODE is "test". Cannot use live IDs in test mode.`);
  }
}

/**
 * Determines whether to use test or live Stripe IDs based on environment
 * @returns {'test'|'live'} The current Stripe mode
 */
function getStripeMode() {
  return stripeConfig?.mode || 'test';
}

// Validate and initialize on module load
let stripe;
let stripeConfig;

try {
  stripeConfig = validateStripeEnv();
  stripe = new Stripe(stripeConfig.secretKey, {
    apiVersion: '2024-12-18.acacia',
  });
  console.log(`✅ Stripe client initialized successfully (mode: ${stripeConfig.mode})`);
} catch (error) {
  console.error('❌ Stripe configuration error:', error.message);
  throw error;
}

export { stripe, stripeConfig, validateStripeIdMode, getStripeMode };
export default stripe;
