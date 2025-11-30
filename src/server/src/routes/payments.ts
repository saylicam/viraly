import express from 'express';
import { stripe, STRIPE_CONFIG } from '../stripe';

const router = express.Router();

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { customerId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: STRIPE_CONFIG.amount,
      currency: STRIPE_CONFIG.currency,
      customer: customerId,
      metadata: {
        product: 'viraly-pro',
        source: 'mobile-app'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create customer
router.post('/create-customer', async (req, res) => {
  try {
    const { email, name } = req.body;

    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        source: 'viraly-app'
      }
    });

    res.json({
      customerId: customer.id,
      email: customer.email
    });

  } catch (error) {
    console.error('Customer creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create customer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get subscription status
router.get('/subscription/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    const isActive = subscriptions.data.length > 0;
    const subscription = isActive ? subscriptions.data[0] : null;

    res.json({
      isActive,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      } : null
    });

  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ 
      error: 'Failed to check subscription',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end
      }
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;