# Data Model

This document describes the key tables and relationships in the PostgreSQL database, managed via Drizzle ORM.

## Entity Relationship Summary

The system revolves around **Coupons** offered by **Merchants** within **Foodie Groups**. **Users** can redeem coupons and may have specialized roles.

## Key Tables

### `user`
- Stores user identity from Cognito.
- `cognito_sub`: Unique ID from Cognito.
- `role`: Global role (`admin`, `merchant`, `customer`, `foodie_group_admin`).

### `merchant`
- Businesses that offer coupons.
- `owner_id`: FK to `user.id`. A merchant is owned by a specific user.

### `foodie_group`
- Communities or geographic areas where coupons are organized.
- Identified by a unique `slug`.

### `coupon`
- The actual offers.
- `merchant_id`: FK to `merchant.id`.
- `group_id`: FK to `foodie_group.id`.
- `locked`: If true, requires a purchase or membership to redeem.

### `coupon_redemption`
- Tracks when a user uses a coupon.
- `coupon_id`: FK to `coupon.id`.
- `user_id`: FK to `user.id`.

### `coupon_submission`
- The pipeline for merchants to submit coupons for approval.
- `state`: `pending`, `approved`, or `rejected`.
- `group_id`: The group for which the coupon is intended.

### `foodie_group_membership`
- Associates users with groups and defines their role within that group.
- `role`: Role specific to this group (e.g., `foodie_group_admin`).

### `purchase`
- Tracks Stripe payments for "locked" coupon access.
- `user_id`, `group_id`: Associates a purchase with a user and a specific group.

## Enums
- `role`: `admin`, `merchant`, `customer`, `foodie_group_admin`
- `submission_state`: `pending`, `approved`, `rejected`
- `coupon_type`: `percent`, `amount`, `bogo`, `free_item`
- `purchase_status`: `created`, `pending`, `paid`, `expired`, `refunded`
