import express from 'express';
import { stripe, STRIPE_CONFIG } from '../stripe';

const router = express.Router();

// Stripe webhook endpoint
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, STRIPE_CONFIG.webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Webhook signature verification failed');
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        // Handle successful payment
        break;

      case 'customer.subscription.created':
        const subscriptionCreated = event.data.object;
        console.log('Subscription created:', subscriptionCreated.id);
        // Handle new subscription
        break;

      case 'customer.subscription.updated':
        const subscriptionUpdated = event.data.object;
        console.log('Subscription updated:', subscriptionUpdated.id);
        // Handle subscription update
        break;

      case 'customer.subscription.deleted':
        const subscriptionDeleted = event.data.object;
        console.log('Subscription deleted:', subscriptionDeleted.id);
        // Handle subscription cancellation
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('Invoice payment succeeded:', invoice.id);
        // Handle successful invoice payment
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('Invoice payment failed:', failedInvoice.id);
        // Handle failed invoice payment
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

export default router;