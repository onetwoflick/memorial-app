import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const { memorialId, email, fullName, editCode } = await req.json();

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: 'usd',
      receipt_email: email, // This tells Stripe to email the receipt
      description: `Tribute for ${fullName}. IMPORTANT: Your private Edit Code is ${editCode}`,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        memorialId, // Link the payment to the memorial
        editCode,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: unknown) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
