import Stripe from 'stripe';
import type { Env } from './types.js';

let stripeInstance: Stripe | null = null;

export function getStripe(env: Env): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil',
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return stripeInstance;
}

// Pricing in pence (GBP minor unit)
export const PRICING = {
  adult: 20000,   // £200
  child: 6000,    // £60
  infant: 0,      // FREE
} as const;

export function formatAmountForDisplay(amountInPence: number): string {
  return (amountInPence / 100).toFixed(2);
}

export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}

export function penceToPounds(pence: number): number {
  return pence / 100;
}

export async function createStripeCustomer(
  stripe: Stripe,
  name: string,
  email: string
): Promise<Stripe.Customer> {
  return stripe.customers.create({ name, email });
}

export async function createCheckoutSession(
  stripe: Stripe,
  params: {
    customerId: string;
    amount: number; // in pence
    description: string;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
  }
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: 'payment',
    currency: 'gbp',
    line_items: [{
      price_data: {
        currency: 'gbp',
        unit_amount: params.amount,
        product_data: {
          name: params.description,
        },
      },
      quantity: 1,
    }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
    payment_intent_data: {
      metadata: params.metadata,
    },
  });
}

export async function verifyWebhookEvent(
  stripe: Stripe,
  rawBody: string,
  signature: string,
  webhookSecret: string
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
}
