import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature")!;
  const raw = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as { id: string };

      // Generate a random 6-character edit code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Save session + code in Supabase
      await supabase.from("memorial_sessions").insert({
        session_id: session.id,
        code,
      });
    }

    return NextResponse.json({ received: true });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("Webhook error:", err?.message);
    return new NextResponse(`Webhook Error: ${err?.message ?? "unknown"}`, { status: 400 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
