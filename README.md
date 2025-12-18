# Viva Spot Coupon Book

Digital coupon management and redemption platform for foodie groups and local merchants.

## 🌟 Overview

Viva Spot Coupon Book is a full-stack web application designed to help "foodie groups" curate and sell digital coupon books featuring local merchants. The platform handles everything from merchant coupon submissions and group administration to secure QR-code-based redemption for customers.

### Core Tech Stack

- **Frontend**: [Vue 3](https://vuejs.org/) (Composition API), [Vuex](https://vuex.vuejs.org/), [Vue Router](https://router.vuejs.org/)
- **Backend**: [Node.js](https://nodejs.org/), [Express 5](https://expressjs.com/), [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Authentication**: [AWS Cognito](https://aws.amazon.com/cognito/)
- **Infrastructure**: [Vercel](https://vercel.com/)
- **Payments**: [Stripe](https://stripe.com/)
- **Testing**: [Vitest](https://vitest.dev/), [Supertest](https://github.com/ladjs/supertest), [PGLite](https://pglite.dev/)

---

## ✨ Key Features

### For Customers
- **Browse & Join Groups**: Discover local foodie groups and join their membership.
- **Digital Coupon Book**: Access a library of coupons from participating merchants.
- **QR Code Redemption**: Securely redeem coupons at physical locations using QR codes.
- **Event RSVPs**: View and sign up for upcoming foodie group events.

### For Merchants
- **Coupon Submissions**: Submit new coupon offers to foodie groups for approval.
- **Merchant Dashboard**: Manage your profile, view redemption history, and track engagement.
- **Event Hosting**: Coordinate with foodie groups to host special events.

### For Group Admins
- **Curation**: Review and approve/reject coupon and event submissions.
- **Membership Management**: Track user roles and group memberships.
- **Dashboard**: High-level overview of group activity and revenue.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **PostgreSQL**: Local instance or AWS RDS
- **AWS CLI**: Configured with credentials for Cognito/S3 access

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/viva-spot-coupon-book.git
   cd viva-spot-coupon-book
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your values (see [Environment Variables](#environment-variables) below).

### Local Development

Run the frontend and backend concurrently:

```bash
# Frontend (localhost:8080)
npm run serve

# Backend (localhost:3000)
npm run dev
```

---

## 🛠️ Database Management

The project uses **Drizzle ORM** for schema management and migrations.

- **Generate & Push Migrations**:
  ```bash
  npm run migrate
  ```
- **Pull Schema from DB**:
  ```bash
  npm run pull-schema
  ```

Schema definition can be found in `server/src/schema.ts`.

---

## 🧪 Testing

The test suite is powered by **Vitest** and covers unit, integration, and UI tests.

```bash
# Run all tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

See [tests/README.md](./tests/README.md) for detailed testing documentation.

---

## 📡 Environment Variables

Create a `.env` file in the root directory. Key variables include:

### Backend
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `DB_HOST` / `DB_USER` / `DB_PASS` | Discrete DB connection params |
| `AWS_REGION` | AWS region (e.g., `us-east-1`) |
| `COGNITO_USER_POOL_ID` | AWS Cognito User Pool ID |
| `COGNITO_CLIENT_ID` | AWS Cognito App Client ID |
| `AWS_S3_MERCHANT_LOGO_BUCKET`| S3 bucket for merchant assets |

### Frontend
| Variable | Description |
|----------|-------------|
| `VUE_APP_API_URL` | Backend API base URL |
| `VUE_APP_GOOGLE_MAPS_API_KEY`| API key for map features |

---

## 📂 Project Structure

```text
├── drizzle/              # DB Migrations & snapshots
├── public/               # Frontend static assets
├── scripts/              # Maintenance & utility scripts
├── server/
│   ├── src/
│   │   ├── middleware/   # Express middlewares (Auth, etc.)
│   │   ├── routes/       # API endpoints (Coupons, Users, etc.)
│   │   ├── index.js      # Main API entry point
│   │   └── schema.ts     # Drizzle schema definitions
├── src/
│   ├── assets/           # Frontend styles & images
│   ├── components/       # Reusable Vue components
│   ├── router/           # Vue Router config
│   ├── services/         # API & Auth services
│   ├── store/            # Vuex state management
│   └── views/            # Main page components
├── tests/                # Full test suite
├── vercel.json           # Vercel deployment config
└── package.json          # Project dependencies & scripts
```

---

## 📦 Deployment

### Vercel (Recommended)

The project is optimized for deployment on Vercel.

1.  **Frontend**: Standard Vue SPA build.
2.  **Backend**: The Express app in `server/src/` is automatically served via Vercel Serverless Functions through the `api/[...slug].js` entrypoint.

To deploy:
```bash
vercel --prod
```

### Local Development
The project can also be run locally using the `npm run dev` and `npm run serve` commands.

---

## 📄 License

This project is private and proprietary.
