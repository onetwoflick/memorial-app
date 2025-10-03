import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new NextResponse("Missing Stripe signature", { status: 400 });
  }

  const raw = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }
    return new NextResponse("Webhook Error: Unknown error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    // In a fuller build, you'd persist a "paid" credit here tied to session.id or email
    // For local, we’ll just rely on verifying the session on /create
  }

  return NextResponse.json({ received: true });
}

// ✅ No `as any` needed
export const config = {
  api: { bodyParser: false },
};
