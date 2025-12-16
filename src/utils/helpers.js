const DEFAULT_CUISINE_TYPE = 'Contemporary';
const DEFAULT_COUPON_TYPE = 'free';

const CUISINE_KEYWORDS = [
  { label: 'Italian', keywords: ['italian', 'pasta', 'pizza', 'risotto', 'spaghetti', 'bistro'] },
  { label: 'Mexican', keywords: ['mexican', 'taco', 'enchilada', 'burrito', 'cantina'] },
  { label: 'French', keywords: ['french', 'fromage', 'creme', 'croissant'] },
  { label: 'Cafe', keywords: ['cafe', 'coffee', 'espresso', 'bean', 'brew'] },
  { label: 'Modern American', keywords: ['modern american', 'new american', 'american', 'gastropub'] },
  { label: 'Fast Food', keywords: ['fast food', 'burger', 'fries', 'drive-thru', 'snack'] },
  { label: 'Fusion', keywords: ['fusion', 'pan-asian', 'hawaiian fusion', 'asian fusion'] },
  { label: 'Dessert', keywords: ['dessert', 'sweet', 'cake', 'pastry'] },
  { label: 'Brunch', keywords: ['brunch', 'mimosas', 'bottomless brunch', 'hash browns'] },
  { label: 'Breakfast', keywords: ['breakfast', 'morning', 'omelet', 'pancake', 'waffle'] },
  { label: 'Bar & Grill', keywords: ['bar', 'grill', 'pub', 'taproom'] },
  { label: 'Casual Dining', keywords: ['diner', 'casual dining', 'family style'] },
  { label: 'Diner', keywords: ['diner', 'short-order', 'roll-up'] },
  { label: 'Seasonal', keywords: ['seasonal', 'holiday', 'pumpkin', 'winter'] },
  { label: 'Family', keywords: ['family', 'kids', 'family-friendly'] },
  { label: 'Thai', keywords: ['thai', 'pad thai', 'thai curry'] },
  { label: 'Seafood', keywords: ['seafood', 'oyster', 'clam', 'lobster'] },
  { label: 'Japanese', keywords: ['japanese', 'sushi', 'ramen', 'yakitori'] },
  { label: 'Mediterranean', keywords: ['mediterranean', 'meze', 'gyro', 'tabbouleh'] },
  { label: 'Indian', keywords: ['indian', 'curry', 'tikka', 'masala'] },
];

const COUPON_TYPE_KEYWORDS = [
  { value: 'bogo', keywords: ['buy one get one', 'bogo', 'two for one', '2 for 1'] },
  { value: 'percentage', keywords: ['percent', 'percentage', '% off', 'percent off', 'percentage off'] },
  { value: 'amount', keywords: ['amount', 'amount off', 'dollars off', 'off $', 'save $'] },
  { value: 'free', keywords: ['free', 'complimentary', 'on the house', 'freebie'] },
];

const COUPON_TYPE_ALIASES = {
  percent: 'percentage',
  percentage: 'percentage',
  'free_item': 'free',
  free: 'free',
  'free item': 'free',
  bogo: 'bogo',
  'buy one get one': 'bogo',
  'buy-one-get-one': 'bogo',
  'two for one': 'bogo',
  '2for1': 'bogo',
  amount: 'amount',
};

const normalizeText = (value) => String(value || '').toLowerCase();

const assembleText = (coupon) => {
  const fields = [
    coupon.title,
    coupon.description,
    coupon.merchant_name,
    coupon.merchantName,
    coupon.foodie_group_name,
  ];
  return fields.map(normalizeText).join(' ');
};

const inferCuisineFromText = (text) => {
  const normalized = text.toLowerCase();
  for (const cuisine of CUISINE_KEYWORDS) {
    if (cuisine.keywords.some((keyword) => normalized.includes(keyword))) {
      return cuisine.label;
    }
  }
  return null;
};

const inferCouponTypeFromText = (text) => {
  const normalized = text.toLowerCase();
  for (const type of COUPON_TYPE_KEYWORDS) {
    if (type.keywords.some((keyword) => normalized.includes(keyword))) {
      return type.value;
    }
  }
  return null;
};

const hasCuisine = (coupon) => {
  const candidate = coupon.cuisine_type || coupon.cuisineType;
  return (
    typeof candidate === 'string' &&
    candidate.trim().length > 0
  );
};

const normalizeCouponTypeCandidate = (value) => {
  if (!value) return null;
  const key = String(value).trim().toLowerCase();
  if (!key) return null;
  if (COUPON_TYPE_ALIASES[key]) {
    return COUPON_TYPE_ALIASES[key];
  }
  if (Object.values(COUPON_TYPE_ALIASES).includes(key)) {
    return key;
  }
  return null;
};

export const ensureCouponHasCuisine = (coupon) => {
  if (!coupon || typeof coupon !== 'object') return coupon;

  if (hasCuisine(coupon)) {
    return {
      ...coupon,
      cuisine_type: (coupon.cuisine_type || coupon.cuisineType).trim(),
    };
  }

  const sourceText = assembleText(coupon);
  const inferred = inferCuisineFromText(sourceText) || DEFAULT_CUISINE_TYPE;

  return {
    ...coupon,
    cuisine_type: inferred,
  };
};

const ensureCouponHasType = (coupon) => {
  if (!coupon || typeof coupon !== 'object') return coupon;

  const existing = coupon.coupon_type || coupon.couponType;
  const normalized = normalizeCouponTypeCandidate(existing);
  if (normalized) {
    return {
      ...coupon,
      coupon_type: normalized,
    };
  }

  const sourceText = assembleText(coupon);
  const inferred = inferCouponTypeFromText(sourceText);

  return {
    ...coupon,
    coupon_type: inferred || DEFAULT_COUPON_TYPE,
  };
};

const ensureCouponNormalized = (coupon) =>
  ensureCouponHasType(ensureCouponHasCuisine(coupon));

export const ensureCouponsHaveCuisine = (coupons) => {
  if (!Array.isArray(coupons)) return [];
  return coupons.map(ensureCouponNormalized);
};

export const ensureCouponsHaveType = (coupons) => {
  if (!Array.isArray(coupons)) return [];
  return coupons.map(ensureCouponHasType);
};
