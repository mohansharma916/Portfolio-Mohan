import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Handle demo orders if Razorpay keys are not configured
    if (!keySecret || razorpay_order_id?.startsWith('order_demo_')) {
      console.log('[RAZORPAY] Verified demo order');
      return Response.json({
        success: true,
        addedMessages: 4,
        isDemo: true,
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return Response.json(
        { error: 'Missing required Razorpay payment verification parameters' },
        { status: 400 }
      );
    }

    // Verify HMAC-SHA256 signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      console.error('[RAZORPAY] Signature verification failed');
      return Response.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    console.log('[RAZORPAY] Payment verified successfully for payment_id:', razorpay_payment_id);

    return Response.json({
      success: true,
      addedMessages: 4,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error('[RAZORPAY] Payment verification error:', error);
    return Response.json(
      { error: 'Internal server error verifying payment' },
      { status: 500 }
    );
  }
}
