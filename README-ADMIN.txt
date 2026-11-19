YUSEE PLUGS ADMIN UPDATE

Adds /admin, secure admin login, product creation with a size/colour/price/stock variant, order details, fulfilment updates, customer role promotion, revenue total and Stripe refund API.

INSTALL:
1. Back up Neon before changing its schema. This schema is a proposed schema for the starter ZIP and may not match any existing data.
2. Add dependencies:
   npm install @prisma/client prisma bcryptjs jose stripe
3. Keep existing DATABASE_URL and DIRECT_URL. Add AUTH_SECRET (random 32+ characters), STRIPE_SECRET_KEY and ADMIN_EMAIL / ADMIN_PASSWORD.
4. Review prisma/schema.prisma carefully against the current Neon database. Do not blindly run db push against a populated database.
5. After review/backup: npx prisma generate && npx prisma db push
6. Create the first admin in an environment with database access:
   ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="long-unique-password" node scripts/create-admin.mjs

HONEST LIMITATIONS:
- This update includes one variant row per product creation; the database supports multiple variant rows, but a multi-row visual variant builder is not yet included.
- Revenue is based only on paid Order rows stored in the database. The starter storefront does not yet create real orders or have a Stripe webhook that records checkouts, so revenue will remain empty until checkout/webhook integration is completed.
- Refunds require a stored Stripe PaymentIntent ID and STRIPE_SECRET_KEY.
- Customer promotion operates on User records in this schema. Existing customer sign-in must be connected to these records before production use.
- Fulfilment status/tracking is saved, but customer email notifications and courier APIs are not included.
- Never commit passwords or Stripe secrets to GitHub.
