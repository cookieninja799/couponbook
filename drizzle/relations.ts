import { relations } from "drizzle-orm/relations";
import { foodieGroup, couponSubmission, merchant, event, eventRsvp, user, coupon, eventSubmission, couponRedemption, foodieGroupMembership, purchase } from "./schema";

export const couponSubmissionRelations = relations(couponSubmission, ({one}) => ({
	foodieGroup: one(foodieGroup, {
		fields: [couponSubmission.groupId],
		references: [foodieGroup.id]
	}),
	merchant: one(merchant, {
		fields: [couponSubmission.merchantId],
		references: [merchant.id]
	}),
}));

export const foodieGroupRelations = relations(foodieGroup, ({many}) => ({
	couponSubmissions: many(couponSubmission),
	coupons: many(coupon),
	eventSubmissions: many(eventSubmission),
	events: many(event),
	foodieGroupMemberships: many(foodieGroupMembership),
	purchases: many(purchase),
}));

export const merchantRelations = relations(merchant, ({one, many}) => ({
	couponSubmissions: many(couponSubmission),
	coupons: many(coupon),
	eventSubmissions: many(eventSubmission),
	events: many(event),
	user: one(user, {
		fields: [merchant.ownerId],
		references: [user.id]
	}),
}));

export const eventRsvpRelations = relations(eventRsvp, ({one}) => ({
	event: one(event, {
		fields: [eventRsvp.eventId],
		references: [event.id]
	}),
	user: one(user, {
		fields: [eventRsvp.userId],
		references: [user.id]
	}),
}));

export const eventRelations = relations(event, ({one, many}) => ({
	eventRsvps: many(eventRsvp),
	foodieGroup: one(foodieGroup, {
		fields: [event.groupId],
		references: [foodieGroup.id]
	}),
	merchant: one(merchant, {
		fields: [event.merchantId],
		references: [merchant.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	eventRsvps: many(eventRsvp),
	couponRedemptions: many(couponRedemption),
	merchants: many(merchant),
	foodieGroupMemberships: many(foodieGroupMembership),
	purchases: many(purchase),
}));

export const couponRelations = relations(coupon, ({one, many}) => ({
	foodieGroup: one(foodieGroup, {
		fields: [coupon.groupId],
		references: [foodieGroup.id]
	}),
	merchant: one(merchant, {
		fields: [coupon.merchantId],
		references: [merchant.id]
	}),
	couponRedemptions: many(couponRedemption),
}));

export const eventSubmissionRelations = relations(eventSubmission, ({one}) => ({
	foodieGroup: one(foodieGroup, {
		fields: [eventSubmission.groupId],
		references: [foodieGroup.id]
	}),
	merchant: one(merchant, {
		fields: [eventSubmission.merchantId],
		references: [merchant.id]
	}),
}));

export const couponRedemptionRelations = relations(couponRedemption, ({one}) => ({
	coupon: one(coupon, {
		fields: [couponRedemption.couponId],
		references: [coupon.id]
	}),
	user: one(user, {
		fields: [couponRedemption.userId],
		references: [user.id]
	}),
}));

export const foodieGroupMembershipRelations = relations(foodieGroupMembership, ({one}) => ({
	user: one(user, {
		fields: [foodieGroupMembership.userId],
		references: [user.id]
	}),
	foodieGroup: one(foodieGroup, {
		fields: [foodieGroupMembership.groupId],
		references: [foodieGroup.id]
	}),
}));

export const purchaseRelations = relations(purchase, ({one}) => ({
	user: one(user, {
		fields: [purchase.userId],
		references: [user.id]
	}),
	foodieGroup: one(foodieGroup, {
		fields: [purchase.groupId],
		references: [foodieGroup.id]
	}),
}));