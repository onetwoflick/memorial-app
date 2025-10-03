import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')!;
  const raw = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e: any) {
    return new NextResponse(`Webhook Error: ${e.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    // In a fuller build, you'd persist a "paid" credit here tied to session.id or email
    // For local, we’ll just rely on verifying the session on /create
  }

  return NextResponse.json({ received: true });
}

export const config = { api: { bodyParser: false } } as any;
