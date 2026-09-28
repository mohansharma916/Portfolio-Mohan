export async function POST(req: Request) {
  try {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET;

    // Amount: ₹10 (in paise = 1000)
    const amount = 1000;
    const currency = 'INR';

    // If keys are not configured yet, return demo order for testing
    if (!keyId || !keySecret) {
      console.log('[RAZORPAY] Keys not configured, operating in demo mode');
      return Response.json({
        isDemo: true,
        orderId: `order_demo_${Date.now()}`,
        amount,
        currency,
        keyId: 'rzp_test_demo',
      });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt: `chat_topup_${Date.now()}`,
        notes: {
          purpose: '4 additional portfolio chat messages',
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[RAZORPAY] Failed to create order:', data);
      return Response.json(
        { error: data.error?.description || 'Failed to create Razorpay order' },
        { status: response.status }
      );
    }

    return Response.json({
      isDemo: false,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId,
    });
  } catch (error) {
    console.error('[RAZORPAY] Internal error creating order:', error);
    return Response.json(
      { error: 'Internal server error creating payment order' },
      { status: 500 }
    );
  }
}
