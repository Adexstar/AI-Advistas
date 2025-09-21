import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('Flutterwave webhook received:', payload)

    // Verify webhook signature (implement based on Flutterwave docs)
    const secretHash = Deno.env.get('FLUTTERWAVE_SECRET_HASH')
    const signature = req.headers.get('verif-hash')
    
    if (!signature || signature !== secretHash) {
      console.error('Invalid webhook signature')
      return new Response('Unauthorized', { status: 401 })
    }

    // Handle successful payment
    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const { tx_ref, customer, meta, amount } = payload.data
      
      console.log('Processing successful payment:', { tx_ref, customer, meta, amount })

      // Create Supabase client with service role
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const user_id = meta.user_id
      const plan = meta.plan
      const interval = meta.interval

      // Calculate subscription period
      const currentPeriodStart = new Date()
      const currentPeriodEnd = new Date()
      if (interval === 'monthly') {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
      } else if (interval === 'yearly') {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
      }

      // Upsert subscription record
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id,
          provider: 'flutterwave',
          provider_subscription_id: tx_ref,
          plan,
          status: 'active',
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
        }, {
          onConflict: 'user_id'
        })

      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError)
        throw subscriptionError
      }

      // Reset usage counters for the user
      const { error: usageError } = await supabase
        .from('user_usage')
        .upsert([
          { user_id, feature: 'ai_generations', usage_count: 0 },
          { user_id, feature: 'active_campaigns', usage_count: 0 },
          { user_id, feature: 'template_downloads', usage_count: 0 },
        ], {
          onConflict: 'user_id,feature'
        })

      if (usageError) {
        console.error('Error resetting usage:', usageError)
      }

      console.log('Subscription updated successfully for user:', user_id)
    }

    return new Response('OK', { 
      headers: corsHeaders,
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})