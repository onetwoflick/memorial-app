import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");

  if (!session_id) {
    return NextResponse.json({ paid: false, error: "Missing session_id" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      // Check if there's already a code for this session
      const { data: existing } = await supabase
        .from("memorial_sessions")
        .select("*")
        .eq("session_id", session_id)
        .single();

      if (existing) {
        return NextResponse.json({
          paid: true,
          code: existing.code,
        });
      }

      // Create a new code and save it in memorial_sessions
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data, error } = await supabase
        .from("memorial_sessions")
        .insert([
          {
            session_id,
            code,
            used: false,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error.message);
        return NextResponse.json({ paid: true, error: error.message });
      }

      return NextResponse.json({ paid: true, code });
    }

    return NextResponse.json({ paid: false });
  } catch (err) {
    console.error("Stripe verify error:", err);
    return NextResponse.json({ paid: false, error: "Stripe verification failed" });
  }
}
