# Yusee Plugs Storefront

A premium, mobile-first fashion storefront starter built with Next.js 15 and React 19.

## Run locally
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open http://localhost:3000.

## Deploy
Push this folder to the separate Yusee Plugs GitHub repository and import it as a new Vercel project. The site is designed as a front-end starter with sample products. Connect your own inventory, authentication, database, delivery and Stripe payment flow before accepting real orders.

## Important
- Product images are remote Unsplash images for demonstration and can be replaced with your own Cloudinary images.
- Bag state is currently held in the browser session and is not yet connected to checkout or order storage.
- Do not add secret keys to client-side code or commit `.env` files.
