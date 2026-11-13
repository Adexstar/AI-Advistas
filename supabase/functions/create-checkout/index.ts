import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { billingReturnUrl, PLAN_PRICES, type PaidPlan } from "../_shared/reconcile.ts"
import { json, requireUser } from "../_shared/guard.ts"

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } })
  }

  try {
    const gate = await requireUser(req)
    if (gate instanceof Response) return gate

    const { plan, email, name, returnOrigin } = await req.json()
    const planDetails = PLAN_PRICES[plan as PaidPlan]
    if (!planDetails) return json({ error: "Choose Pro or Enterprise." }, 400)
    if (typeof email !== "string" || !email.includes("@")) return json({ error: "A customer email is required for checkout." }, 400)

    const secret = Deno.env.get("FLUTTERWAVE_SECRET_KEY")
    if (!secret) {
      return json({
        error: "Payments are unavailable until Flutterwave is configured.",
        unavailable: true,
      }, 503)
    }

    const txRef = `sub_${gate.user.id}_${crypto.randomUUID()}`
    const redirectUrl = billingReturnUrl(String(returnOrigin ?? ""), txRef, Deno.env.get("SITE_URL"))
    if (!redirectUrl) {
      return json({ error: "Set SITE_URL to this app's address, then try checkout again." }, 400)
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )
    const { error: sessionError } = await admin.from("checkout_sessions").insert({
      tx_ref: txRef,
      user_id: gate.user.id,
      plan,
      amount: planDetails.amount,
      currency: planDetails.currency,
      interval: planDetails.interval,
      status: "pending",
    })
    if (sessionError) return json({ error: "Could not start checkout." }, 500)

    const flutterwaveResponse = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: planDetails.amount,
        currency: planDetails.currency,
        redirect_url: redirectUrl,
        payment_options: "card,banktransfer,ussd,mobilemoney",
        customer: {
          email,
          name: name || "AdVista customer",
        },
        customizations: {
          title: "AdVista",
          description: `${plan} plan`,
        },
        meta: {
          user_id: gate.user.id,
          plan,
          interval: planDetails.interval,
        },
      }),
    })

    if (!flutterwaveResponse.ok) {
      await admin.from("checkout_sessions").update({ status: "failed", failure_reason: "Provider rejected checkout" }).eq("tx_ref", txRef)
      return json({ error: "Flutterwave could not start checkout.", unavailable: true }, 502)
    }

    const flutterwaveData = await flutterwaveResponse.json()
    const checkoutUrl = flutterwaveData?.data?.link || flutterwaveData?.data?.hosted_link
    if (flutterwaveData.status !== "success" || !checkoutUrl) {
      await admin.from("checkout_sessions").update({ status: "failed", failure_reason: flutterwaveData?.message ?? "No checkout link" }).eq("tx_ref", txRef)
      return json({ error: "Flutterwave could not start checkout.", unavailable: true }, 502)
    }

    return json({ checkout_url: checkoutUrl, tx_ref: txRef })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not start checkout." }, 400)
  }
})
