import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  const session_id = new URL(req.url).searchParams.get('session_id');
  if (!session_id) return NextResponse.json({ paid: false });

  const session = await stripe.checkout.sessions.retrieve(session_id);
  const paid = session.payment_status === 'paid' || session.status === 'complete';
  return NextResponse.json({ paid });
}
