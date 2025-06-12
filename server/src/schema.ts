// server/src/schema.ts
import {
    pgEnum, pgTable,
    uuid, varchar, text, jsonb,
    timestamp, boolean, integer, doublePrecision
  } from 'drizzle-orm/pg-core';
  import { relations } from 'drizzle-orm';
  
  // ────────────────────────────────────────
  // ENUMS
  // ────────────────────────────────────────
  export const role             = pgEnum('role',             ['admin','merchant','customer']);
  export const submissionState  = pgEnum('submission_state', ['pending','approved','rejected']);
  export const couponType       = pgEnum('coupon_type',      ['percent','amount','bogo','free_item']);
  export const purchaseStatus   = pgEnum('purchase_status',  ['created','pending','paid','expired','refunded']);
  export const attendanceStatus = pgEnum('attendance_status',['going','waitlist','cancelled']);
  
  // ────────────────────────────────────────
  // TABLES
  // ────────────────────────────────────────
  export const users = pgTable('user', {
    id:         uuid('id').primaryKey().defaultRandom(),
    cognitoSub: varchar('cognito_sub', { length: 255 }).unique().notNull(),
    email:      varchar('email', { length: 255 }).unique().notNull(),
    name:       varchar('name',  { length: 255 }).notNull(),
    role:       role('role').default('customer').notNull(),
    createdAt:  timestamp('created_at').defaultNow().notNull(),
    updatedAt:  timestamp('updated_at').defaultNow().notNull(),
    deletedAt:  timestamp('deleted_at')
  });
  
  export const foodieGroups = pgTable('foodie_group', {
    id:             uuid('id').primaryKey().defaultRandom(),
    slug:           varchar('slug', { length: 255 }).unique().notNull(),
    name:           varchar('name', { length: 255 }).notNull(),
    description:    text('description'),
    location:       varchar('location', { length: 255 }),
    bannerImageUrl: varchar('banner_image_url', { length: 500 }),
    map:            jsonb('map'),
    socialLinks:    jsonb('social_links'),
    createdAt:      timestamp('created_at').defaultNow().notNull(),
    updatedAt:      timestamp('updated_at').defaultNow().notNull(),
    archivedAt:     timestamp('archived_at')
  });
  
  export const foodieGroupMemberships = pgTable('foodie_group_membership', {
    id:        uuid('id').primaryKey().defaultRandom(),
    userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    groupId:   uuid('group_id').notNull().references(() => foodieGroups.id, { onDelete: 'cascade' }),
    role:      role('role').default('customer').notNull(),
    joinedAt:  timestamp('joined_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  }, (t) => ({
    // compound PK/unique + indexes from Prisma
    uniqueMember: (t.userId, t.groupId),
    idxUser:      t.userId,
    idxGroup:     t.groupId
  }));
  
  export const merchants = pgTable('merchant', {
    id:      uuid('id').primaryKey().defaultRandom(),
    name:    varchar('name', { length: 255 }).notNull(),
    logoUrl: varchar('logo_url', { length: 500 }),
    ownerId: uuid('owner_id').notNull().references(() => users.id),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  });
  
  export const coupons = pgTable('coupon', {
    id:            uuid('id').primaryKey().defaultRandom(),
    groupId:       uuid('group_id').notNull().references(() => foodieGroups.id),
    merchantId:    uuid('merchant_id').notNull().references(() => merchants.id),
    title:         varchar('title', { length: 255 }).notNull(),
    description:   text('description'),
    couponType:    couponType('coupon_type').notNull(),
    discountValue: doublePrecision('discount_value').notNull(),
    validFrom:     timestamp('valid_from').notNull(),
    expiresAt:     timestamp('expires_at').notNull(),
    qrCodeUrl:     varchar('qr_code_url', { length: 500 }),
    locked:        boolean('locked').default(true).notNull(),
    createdAt:     timestamp('created_at').defaultNow().notNull(),
    updatedAt:     timestamp('updated_at').defaultNow().notNull(),
    deletedAt:     timestamp('deleted_at')
  }, (t) => ({
    idxGroup: t.groupId
  }));
  
  export const purchases = pgTable('purchase', {
    id:                   uuid('id').primaryKey().defaultRandom(),
    userId:               uuid('user_id').notNull().references(() => users.id),
    groupId:              uuid('group_id').notNull().references(() => foodieGroups.id),
    stripeCheckoutId:     varchar('stripe_checkout_id', { length: 255 }).unique().notNull(),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
    amountCents:          integer('amount_cents').notNull(),
    currency:             varchar('currency', { length: 10 }).notNull(),
    status:               purchaseStatus('status').notNull(),
    purchasedAt:          timestamp('purchased_at').notNull(),
    expiresAt:            timestamp('expires_at'),
    refundedAt:           timestamp('refunded_at'),
    createdAt:            timestamp('created_at').defaultNow().notNull(),
    updatedAt:            timestamp('updated_at').defaultNow().notNull()
  }, (t) => ({
    idxUser:  t.userId,
    idxGroup: t.groupId
  }));
  
  export const events = pgTable('event', {
    id:            uuid('id').primaryKey().defaultRandom(),
    groupId:       uuid('group_id').notNull().references(() => foodieGroups.id),
    merchantId:    uuid('merchant_id').notNull().references(() => merchants.id),
    name:          varchar('name', { length: 255 }).notNull(),
    description:   text('description'),
    startDatetime: timestamp('start_datetime').notNull(),
    endDatetime:   timestamp('end_datetime'),
    location:      varchar('location', { length: 255 }),
    capacity:      integer('capacity').notNull(),
    coverImageUrl: varchar('cover_image_url', { length: 500 }),
    createdAt:     timestamp('created_at').defaultNow().notNull(),
    updatedAt:     timestamp('updated_at').defaultNow().notNull(),
    deletedAt:     timestamp('deleted_at')
  }, (t) => ({
    idxGroupDate: (t.groupId, t.startDatetime)
  }));
  
  export const eventRsvps = pgTable('event_rsvp', {
    id:        uuid('id').primaryKey().defaultRandom(),
    eventId:   uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    userId:    uuid('user_id').notNull().references(() => users.id,  { onDelete: 'cascade' }),
    attendees: integer('attendees').notNull(),
    status:    attendanceStatus('status').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at')
  }, (t) => ({
    uniqueRsvp: (t.eventId, t.userId),
    idxEvent:   t.eventId
  }));
  
  export const couponRedemptions = pgTable('coupon_redemption', {
    id:         uuid('id').primaryKey().defaultRandom(),
    couponId:   uuid('coupon_id').notNull().references(() => coupons.id, { onDelete: 'cascade' }),
    userId:     uuid('user_id').notNull().references(() => users.id,   { onDelete: 'cascade' }),
    redeemedAt: timestamp('redeemed_at').defaultNow().notNull(),
    locationMeta: jsonb('location_meta'),
    deletedAt:  timestamp('deleted_at')
  }, (t) => ({
    uniqueRedeem: (t.couponId, t.userId),
    idxCoupon:    t.couponId
  }));
  
  export const couponSubmissions = pgTable('coupon_submission', {
    id:          uuid('id').primaryKey().defaultRandom(),
    groupId:     uuid('group_id').notNull().references(() => foodieGroups.id),
    merchantId:  uuid('merchant_id').references(() => merchants.id, { onDelete: 'set null' }),
    state:       submissionState('state').notNull(),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
    submissionData: jsonb('submission_data').notNull(),
    deletedAt:   timestamp('deleted_at')
  });
  
  export const eventSubmissions = pgTable('event_submission', {
    id:          uuid('id').primaryKey().defaultRandom(),
    groupId:     uuid('group_id').notNull().references(() => foodieGroups.id),
    merchantId:  uuid('merchant_id').references(() => merchants.id, { onDelete: 'set null' }),
    state:       submissionState('state').notNull(),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
    submissionData: jsonb('submission_data').notNull(),
    deletedAt:   timestamp('deleted_at')
  });
  
  // ────────────────────────────────────────
  // RELATIONS (Drizzle v2 helper)
  // ────────────────────────────────────────
  export const usersRelations = relations(users, ({ many }) => ({
    merchants:    many(merchants),
    memberships:  many(foodieGroupMemberships),
    purchases:    many(purchases),
    rsvps:        many(eventRsvps),
    redemptions:  many(couponRedemptions)
  }));
  
  export const foodieGroupsRelations = relations(foodieGroups, ({ many }) => ({
    memberships:       many(foodieGroupMemberships),
    coupons:           many(coupons),
    events:            many(events),
    purchases:         many(purchases),
    couponSubmissions: many(couponSubmissions),
    eventSubmissions:  many(eventSubmissions)
  }));
  
  export const foodieGroupMembershipsRelations = relations(foodieGroupMemberships,
   ({ one }) => ({
    user:  one(users,        { fields: [foodieGroupMemberships.userId],  references: [users.id] }),
    group: one(foodieGroups, { fields: [foodieGroupMemberships.groupId], references: [foodieGroups.id] })
  }));
  
  export const merchantsRelations = relations(merchants, ({ one, many }) => ({
    owner:            one(users,   { fields: [merchants.ownerId],   references: [users.id] }),
    coupons:          many(coupons),
    events:           many(events),
    couponSubmissions: many(couponSubmissions),
    eventSubmissions:  many(eventSubmissions)
  }));
  
  export const couponsRelations = relations(coupons, ({ one, many }) => ({
    foodieGroup: one(foodieGroups, { fields: [coupons.groupId],    references: [foodieGroups.id] }),
    merchant:    one(merchants,    { fields: [coupons.merchantId], references: [merchants.id] }),
    redemptions: many(couponRedemptions)
  }));
  
  export const eventsRelations = relations(events, ({ one, many }) => ({
    foodieGroup: one(foodieGroups, { fields: [events.groupId],    references: [foodieGroups.id] }),
    merchant:    one(merchants,    { fields: [events.merchantId], references: [merchants.id] }),
    rsvps:       many(eventRsvps)
  }));
  
  export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
    user:  one(users,  { fields: [eventRsvps.userId],  references: [users.id] }),
    event: one(events, { fields: [eventRsvps.eventId], references: [events.id] })
  }));
  
  export const couponRedemptionsRelations = relations(couponRedemptions, ({ one }) => ({
    user:   one(users,   { fields: [couponRedemptions.userId],  references: [users.id] }),
    coupon: one(coupons, { fields: [couponRedemptions.couponId],references: [coupons.id] })
  }));
  
  export const purchasesRelations = relations(purchases, ({ one }) => ({
    user:  one(users,        { fields: [purchases.userId],  references: [users.id] }),
    group: one(foodieGroups, { fields: [purchases.groupId], references: [foodieGroups.id] })
  }));
  
  export const couponSubmissionsRelations = relations(couponSubmissions, ({ one }) => ({
    foodieGroup: one(foodieGroups, { fields: [couponSubmissions.groupId],    references: [foodieGroups.id] }),
    merchant:    one(merchants,    { fields: [couponSubmissions.merchantId], references: [merchants.id] })
  }));
  
  export const eventSubmissionsRelations = relations(eventSubmissions, ({ one }) => ({
    foodieGroup: one(foodieGroups, { fields: [eventSubmissions.groupId],    references: [foodieGroups.id] }),
    merchant:    one(merchants,    { fields: [eventSubmissions.merchantId], references: [merchants.id] })
  }));
  