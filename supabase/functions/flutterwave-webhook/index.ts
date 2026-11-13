import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { reconcileCharge } from "../_shared/reconcile.ts"

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, verif-hash" } })
  }

  const secretHash = Deno.env.get("FLUTTERWAVE_SECRET_HASH")
  const signature = req.headers.get("verif-hash")
  if (!secretHash || !signature || signature !== secretHash) {
    return new Response("Unauthorized", { status: 401 })
  }

  const secret = Deno.env.get("FLUTTERWAVE_SECRET_KEY")
  if (!secret) return new Response("Payments are not configured", { status: 503 })

  try {
    const payload = await req.json()
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )
    const txRef = payload?.data?.tx_ref as string | undefined
    const transactionId = payload?.data?.id

    if (payload?.event === "subscription.cancelled" && txRef) {
      const { data: session } = await admin.from("checkout_sessions").select("user_id").eq("tx_ref", txRef).maybeSingle()
      if (session?.user_id) {
        await admin.from("subscriptions").update({ status: "cancelled" }).eq("user_id", session.user_id).eq("provider_subscription_id", txRef)
      }
      return Response.json({ received: true })
    }

    if (payload?.event !== "charge.completed" || !txRef || transactionId == null) {
      return Response.json({ ignored: true })
    }

    const { data: session } = await admin.from("checkout_sessions").select("*").eq("tx_ref", txRef).maybeSingle()
    if (!session) return Response.json({ ignored: "Unknown checkout" })
    if (session.status === "paid") return Response.json({ duplicate: true })

    const verifyResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: { Authorization: `Bearer ${secret}` },
    })
    if (!verifyResponse.ok) return new Response("Could not verify the transaction", { status: 502 })
    const verifiedBody = await verifyResponse.json()
    const verified = verifiedBody?.data ?? {}
    const decision = reconcileCharge(
      { txRef: session.tx_ref, amount: Number(session.amount), currency: session.currency, plan: session.plan },
      { status: verified.status, tx_ref: verified.tx_ref, amount: verified.amount, currency: verified.currency },
    )

    if (!decision.ok) {
      await admin.from("checkout_sessions").update({
        status: "rejected",
        provider_transaction_id: String(transactionId),
        failure_reason: decision.reason,
        processed_at: new Date().toISOString(),
      }).eq("tx_ref", txRef).eq("status", "pending")
      return Response.json({ rejected: decision.reason })
    }

    const { data: locked } = await admin.from("checkout_sessions").update({
      status: "paid",
      provider_transaction_id: String(verified.id ?? transactionId),
      processed_at: new Date().toISOString(),
    }).eq("tx_ref", txRef).eq("status", "pending").select("tx_ref")
    if (!locked?.length) return Response.json({ duplicate: true })

    const periodStart = new Date()
    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + 1)
    const { error: subscriptionError } = await admin.from("subscriptions").upsert({
      user_id: session.user_id,
      provider: "flutterwave",
      provider_subscription_id: txRef,
      plan: session.plan,
      status: "active",
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
    }, { onConflict: "user_id" })
    if (subscriptionError) return new Response("Could not grant the plan", { status: 500 })

    return Response.json({ granted: true })
  } catch (error) {
    console.error("flutterwave webhook", error)
    return new Response("Webhook failed", { status: 500 })
  }
})
