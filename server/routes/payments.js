import express from 'express';
import { body, validationResult } from 'express-validator';
import Stripe from 'stripe';
import paypal from 'paypal-rest-sdk';
import axios from 'axios';
import Donation from '../models/Donation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configure PayPal
paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

// Create Stripe payment intent
router.post('/stripe/create-intent', authenticateToken, [
  body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
  body('currency').isIn(['USD', 'EUR', 'GBP']).withMessage('Invalid currency'),
  body('donorName').optional().isLength({ max: 100 }).trim(),
  body('message').optional().isLength({ max: 500 }).trim(),
  body('isAnonymous').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, currency, donorName, message, isAnonymous } = req.body;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        userId: req.user.userId.toString(),
        donorName: donorName || '',
        message: message || '',
        isAnonymous: isAnonymous || false
      }
    });

    // Create donation record
    const donation = new Donation({
      userId: req.user.userId,
      amount,
      currency,
      paymentMethod: 'stripe',
      paymentId: paymentIntent.id,
      donorName,
      message,
      isAnonymous,
      status: 'pending'
    });

    await donation.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        donationId: donation._id
      }
    });

  } catch (error) {
    console.error('Stripe payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent'
    });
  }
});

// Confirm Stripe payment
router.post('/stripe/confirm', authenticateToken, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required')
], async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update donation status
      await Donation.findOneAndUpdate(
        { paymentId: paymentIntentId },
        { 
          status: 'completed',
          donorEmail: paymentIntent.receipt_email
        }
      );

      res.json({
        success: true,
        message: 'Payment confirmed successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

  } catch (error) {
    console.error('Stripe confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment'
    });
  }
});

// Create PayPal payment
router.post('/paypal/create', authenticateToken, [
  body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
  body('currency').isIn(['USD', 'EUR', 'GBP']).withMessage('Invalid currency'),
  body('donorName').optional().isLength({ max: 100 }).trim(),
  body('message').optional().isLength({ max: 500 }).trim(),
  body('isAnonymous').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, currency, donorName, message, isAnonymous } = req.body;

    const create_payment_json = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `${process.env.CLIENT_URL}/donation/success`,
        cancel_url: `${process.env.CLIENT_URL}/donation/cancel`
      },
      transactions: [{
        item_list: {
          items: [{
            name: 'Never Relapse Donation',
            sku: 'donation',
            price: amount.toString(),
            currency: currency,
            quantity: 1
          }]
        },
        amount: {
          currency: currency,
          total: amount.toString()
        },
        description: 'Support Never Relapse recovery platform'
      }]
    };

    paypal.payment.create(create_payment_json, async (error, payment) => {
      if (error) {
        console.error('PayPal payment creation error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create PayPal payment'
        });
      }

      // Create donation record
      const donation = new Donation({
        userId: req.user.userId,
        amount,
        currency,
        paymentMethod: 'paypal',
        paymentId: payment.id,
        donorName,
        message,
        isAnonymous,
        status: 'pending'
      });

      await donation.save();

      const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;

      res.json({
        success: true,
        data: {
          paymentId: payment.id,
          approvalUrl,
          donationId: donation._id
        }
      });
    });

  } catch (error) {
    console.error('PayPal payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create PayPal payment'
    });
  }
});

// Execute PayPal payment
router.post('/paypal/execute', authenticateToken, [
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('payerId').notEmpty().withMessage('Payer ID is required')
], async (req, res) => {
  try {
    const { paymentId, payerId } = req.body;

    const execute_payment_json = {
      payer_id: payerId
    };

    paypal.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
      if (error) {
        console.error('PayPal execution error:', error);
        await Donation.findOneAndUpdate(
          { paymentId },
          { status: 'failed' }
        );
        return res.status(500).json({
          success: false,
          message: 'Failed to execute PayPal payment'
        });
      }

      if (payment.state === 'approved') {
        await Donation.findOneAndUpdate(
          { paymentId },
          { 
            status: 'completed',
            donorEmail: payment.payer.payer_info.email
          }
        );

        res.json({
          success: true,
          message: 'PayPal payment completed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'PayPal payment not approved'
        });
      }
    });

  } catch (error) {
    console.error('PayPal execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute PayPal payment'
    });
  }
});

// Create M-Pesa payment
router.post('/mpesa/create', authenticateToken, [
  body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Amount must be at least 1 KES'),
  body('phoneNumber').matches(/^254[0-9]{9}$/).withMessage('Invalid Kenyan phone number format (254XXXXXXXXX)'),
  body('donorName').optional().isLength({ max: 100 }).trim(),
  body('message').optional().isLength({ max: 500 }).trim(),
  body('isAnonymous').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, phoneNumber, donorName, message, isAnonymous } = req.body;

    // Get M-Pesa access token
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    
    const tokenResponse = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    
    // Generate password
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    // Create STK push request
    const stkPushResponse = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: `${process.env.SERVER_URL}/api/payments/mpesa/callback`,
      AccountReference: 'Never Relapse Donation',
      TransactionDesc: 'Support Never Relapse recovery platform'
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (stkPushResponse.data.ResponseCode === '0') {
      // Create donation record
      const donation = new Donation({
        userId: req.user.userId,
        amount,
        currency: 'KES',
        paymentMethod: 'mpesa',
        paymentId: stkPushResponse.data.CheckoutRequestID,
        donorName,
        message,
        isAnonymous,
        status: 'pending',
        metadata: {
          phoneNumber,
          merchantRequestId: stkPushResponse.data.MerchantRequestID
        }
      });

      await donation.save();

      res.json({
        success: true,
        message: 'M-Pesa payment initiated. Please check your phone for the payment prompt.',
        data: {
          checkoutRequestId: stkPushResponse.data.CheckoutRequestID,
          donationId: donation._id
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to initiate M-Pesa payment'
      });
    }

  } catch (error) {
    console.error('M-Pesa payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create M-Pesa payment'
    });
  }
});

// Get M-Pesa payment status
router.get('/mpesa/status/:checkoutRequestId', authenticateToken, async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    // Get M-Pesa access token
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    
    const tokenResponse = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    // Query payment status
    const statusResponse = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query', {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    let status = 'pending';
    if (statusResponse.data.ResponseCode === '0') {
      if (statusResponse.data.ResultCode === '0') {
        status = 'completed';
        // Update donation status
        await Donation.findOneAndUpdate(
          { paymentId: checkoutRequestId },
          { status: 'completed' }
        );
      } else if (statusResponse.data.ResultCode === '1032') {
        status = 'cancelled';
        await Donation.findOneAndUpdate(
          { paymentId: checkoutRequestId },
          { status: 'failed' }
        );
      } else {
        status = 'failed';
        await Donation.findOneAndUpdate(
          { paymentId: checkoutRequestId },
          { status: 'failed' }
        );
      }
    }

    res.json({
      success: true,
      data: {
        status,
        resultCode: statusResponse.data.ResultCode,
        resultDesc: statusResponse.data.ResultDesc
      }
    });

  } catch (error) {
    console.error('M-Pesa status query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status'
    });
  }
});

// Manual M-Pesa payment recording
router.post('/mpesa/manual', authenticateToken, [
  body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Amount must be at least 1 KES'),
  body('donorName').optional().isLength({ max: 100 }).trim(),
  body('message').optional().isLength({ max: 500 }).trim(),
  body('isAnonymous').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, donorName, message, isAnonymous } = req.body;

    // Create donation record for manual M-Pesa payment
    const donation = new Donation({
      userId: req.user.userId,
      amount,
      currency: 'KES',
      paymentMethod: 'mpesa',
      paymentId: `manual_${Date.now()}_${req.user.userId}`,
      donorName,
      message,
      isAnonymous,
      status: 'completed', // Mark as completed for manual payments
      metadata: {
        phoneNumber: '0703141296',
        recipientName: 'Philip Ondieki',
        paymentType: 'manual'
      }
    });

    await donation.save();

    res.json({
      success: true,
      message: 'Donation recorded successfully',
      data: {
        donationId: donation._id,
        amount: donation.amount,
        currency: donation.currency
      }
    });

  } catch (error) {
    console.error('Manual M-Pesa payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record donation'
    });
  }
});

// M-Pesa callback
router.post('/mpesa/callback', async (req, res) => {
  try {
    const { Body } = req.body;
    
    if (Body.stkCallback.ResultCode === 0) {
      // Payment successful
      const checkoutRequestId = Body.stkCallback.CheckoutRequestID;
      const mpesaReceiptNumber = Body.stkCallback.CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber').Value;
      
      await Donation.findOneAndUpdate(
        { paymentId: checkoutRequestId },
        { 
          status: 'completed',
          metadata: {
            ...req.body.metadata,
            mpesaReceiptNumber
          }
        }
      );
    } else {
      // Payment failed
      await Donation.findOneAndUpdate(
        { paymentId: Body.stkCallback.CheckoutRequestID },
        { status: 'failed' }
      );
    }

    res.json({ success: true });

  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ success: false });
  }
});

// Get donation history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      Donation.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-metadata'),
      Donation.countDocuments({ userId: req.user.userId })
    ]);

    res.json({
      success: true,
      data: {
        donations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get donation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get donation history'
    });
  }
});

// Get donation statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Donation.aggregate([
      { $match: { userId: req.user.userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalDonations: { $sum: 1 },
          averageDonation: { $avg: '$amount' },
          currencies: { $addToSet: '$currency' },
          paymentMethods: { $addToSet: '$paymentMethod' }
        }
      }
    ]);

    const result = stats[0] || {
      totalAmount: 0,
      totalDonations: 0,
      averageDonation: 0,
      currencies: [],
      paymentMethods: []
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get donation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get donation statistics'
    });
  }
});

export default router;