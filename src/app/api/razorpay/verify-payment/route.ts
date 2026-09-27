import crypto from 'crypto';
import { addServerExtra, getClientIdentifiers } from '@/lib/server-tracking';

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, fingerprint } =
      rawBody;

    const keys = getClientIdentifiers(req, fingerprint);
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Helper to format success response with cookies
    const makeSuccessResponse = (addedMessages: number, isDemo = false, paymentId?: string) => {
      const newExtra = addServerExtra(keys, addedMessages);
      const res = Response.json({
        success: true,
        addedMessages,
        newExtra,
        isDemo,
        paymentId,
      });
      res.headers.append(
        'Set-Cookie',
        `fastfolio_extra_messages=${newExtra}; Path=/; Max-Age=31536000; SameSite=Lax`
      );
      res.headers.append(
        'Set-Cookie',
        `fastfolio_rate_limit_reached=false; Path=/; Max-Age=31536000; SameSite=Lax`
      );
      return res;
    };

    // Handle demo orders if Razorpay keys are not configured
    if (!keySecret || razorpay_order_id?.startsWith('order_demo_')) {
      console.log('[RAZORPAY] Verified demo order for keys:', keys);
      return makeSuccessResponse(4, true);
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

    console.log('[RAZORPAY] Payment verified successfully for payment_id:', razorpay_payment_id, 'keys:', keys);
    return makeSuccessResponse(4, false, razorpay_payment_id);
  } catch (error) {
    console.error('[RAZORPAY] Payment verification error:', error);
    return Response.json(
      { error: 'Internal server error verifying payment' },
      { status: 500 }
    );
  }
}
