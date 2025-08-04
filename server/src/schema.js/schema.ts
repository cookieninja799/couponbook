import { pgTable, foreignKey, uuid, timestamp, jsonb, integer, varchar, text, doublePrecision, boolean, unique, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const attendanceStatus = pgEnum("attendance_status", ['going', 'waitlist', 'cancelled'])
export const couponType = pgEnum("coupon_type", ['percent', 'amount', 'bogo', 'free_item'])
export const purchaseStatus = pgEnum("purchase_status", ['created', 'pending', 'paid', 'expired', 'refunded'])
export const role = pgEnum("role", ['admin', 'merchant', 'customer'])
export const submissionState = pgEnum("submission_state", ['pending', 'approved', 'rejected'])


export const couponSubmission = pgTable("coupon_submission", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupId: uuid("group_id").notNull(),
	merchantId: uuid("merchant_id"),
	state: submissionState().notNull(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow().notNull(),
	submissionData: jsonb("submission_data").notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [foodieGroup.id],
			name: "coupon_submission_group_id_foodie_group_id_fk"
		}),
	foreignKey({
			columns: [table.merchantId],
			foreignColumns: [merchant.id],
			name: "coupon_submission_merchant_id_merchant_id_fk"
		}).onDelete("set null"),
]);

export const eventRsvp = pgTable("event_rsvp", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id").notNull(),
	userId: uuid("user_id").notNull(),
	attendees: integer().notNull(),
	status: attendanceStatus().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [event.id],
			name: "event_rsvp_event_id_event_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "event_rsvp_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const coupon = pgTable("coupon", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupId: uuid("group_id").notNull(),
	merchantId: uuid("merchant_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	couponType: couponType("coupon_type").notNull(),
	discountValue: doublePrecision("discount_value").notNull(),
	validFrom: timestamp("valid_from", { mode: 'string' }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	qrCodeUrl: varchar("qr_code_url", { length: 500 }),
	locked: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	cuisineType: varchar("cuisine_type", { length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [foodieGroup.id],
			name: "coupon_group_id_foodie_group_id_fk"
		}),
	foreignKey({
			columns: [table.merchantId],
			foreignColumns: [merchant.id],
			name: "coupon_merchant_id_merchant_id_fk"
		}),
]);

export const eventSubmission = pgTable("event_submission", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupId: uuid("group_id").notNull(),
	merchantId: uuid("merchant_id"),
	state: submissionState().notNull(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow().notNull(),
	submissionData: jsonb("submission_data").notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [foodieGroup.id],
			name: "event_submission_group_id_foodie_group_id_fk"
		}),
	foreignKey({
			columns: [table.merchantId],
			foreignColumns: [merchant.id],
			name: "event_submission_merchant_id_merchant_id_fk"
		}).onDelete("set null"),
]);

export const event = pgTable("event", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupId: uuid("group_id").notNull(),
	merchantId: uuid("merchant_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	startDatetime: timestamp("start_datetime", { mode: 'string' }).notNull(),
	endDatetime: timestamp("end_datetime", { mode: 'string' }),
	location: varchar({ length: 255 }),
	capacity: integer().notNull(),
	coverImageUrl: varchar("cover_image_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [foodieGroup.id],
			name: "event_group_id_foodie_group_id_fk"
		}),
	foreignKey({
			columns: [table.merchantId],
			foreignColumns: [merchant.id],
			name: "event_merchant_id_merchant_id_fk"
		}),
]);

export const couponRedemption = pgTable("coupon_redemption", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	couponId: uuid("coupon_id").notNull(),
	userId: uuid("user_id").notNull(),
	redeemedAt: timestamp("redeemed_at", { mode: 'string' }).defaultNow().notNull(),
	locationMeta: jsonb("location_meta"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.couponId],
			foreignColumns: [coupon.id],
			name: "coupon_redemption_coupon_id_coupon_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "coupon_redemption_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cognitoSub: varchar("cognito_sub", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	role: role().default('customer').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	unique("user_cognito_sub_unique").on(table.cognitoSub),
	unique("user_email_unique").on(table.email),
]);

export const foodieGroup = pgTable("foodie_group", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	location: varchar({ length: 255 }),
	bannerImageUrl: varchar("banner_image_url", { length: 500 }),
	map: jsonb(),
	socialLinks: jsonb("social_links"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	archivedAt: timestamp("archived_at", { mode: 'string' }),
}, (table) => [
	unique("foodie_group_slug_unique").on(table.slug),
]);

export const merchant = pgTable("merchant", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	logoUrl: varchar("logo_url", { length: 500 }),
	ownerId: uuid("owner_id").notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [user.id],
			name: "merchant_owner_id_user_id_fk"
		}),
]);

export const foodieGroupMembership = pgTable("foodie_group_membership", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	groupId: uuid("group_id").notNull(),
	role: role().default('customer').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "foodie_group_membership_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [foodieGroup.id],
			name: "foodie_group_membership_group_id_foodie_group_id_fk"
		}).onDelete("cascade"),
]);

export const purchase = pgTable("purchase", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	groupId: uuid("group_id").notNull(),
	stripeCheckoutId: varchar("stripe_checkout_id", { length: 255 }).notNull(),
	stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
	amountCents: integer("amount_cents").notNull(),
	currency: varchar({ length: 10 }).notNull(),
	status: purchaseStatus().notNull(),
	purchasedAt: timestamp("purchased_at", { mode: 'string' }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	refundedAt: timestamp("refunded_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "purchase_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [foodieGroup.id],
			name: "purchase_group_id_foodie_group_id_fk"
		}),
	unique("purchase_stripe_checkout_id_unique").on(table.stripeCheckoutId),
]);
