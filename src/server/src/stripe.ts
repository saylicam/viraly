import Stripe from 'stripe';
import { env } from './env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const STRIPE_CONFIG = {
  priceId: env.STRIPE_PRICE_ID,
  webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  currency: 'eur',
  amount: 999, // 9.99 EUR in cents
};


