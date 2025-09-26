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
    const { plan, email, name } = await req.json()
    
    console.log('Creating checkout for:', { plan, email, name })

    // Get authorization header
    const authHeader = req.headers.get('Authorization')!
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Define plan pricing
    const planPricing: Record<string, { amount: number, interval: string }> = {
      pro: { amount: 2900, interval: 'monthly' }, // $29/month
      enterprise: { amount: 9900, interval: 'monthly' }, // $99/month
    }

    const planDetails = planPricing[plan]
    if (!planDetails) {
      throw new Error('Invalid plan')
    }

    // Create Flutterwave payment link
    const flutterwaveResponse = await fetch('https://api.flutterwave.com/v3/payment-links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('FLUTTERWAVE_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: `sub_${user.id}_${Date.now()}`,
        amount: planDetails.amount / 100, // Convert from cents to dollars
        currency: 'USD',
        country: 'US',
        payment_options: 'card,banktransfer,ussd,mobilemoney',
        redirect_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/flutterwave-webhook`,
        customer: {
          email: email || user.email,
          name: name || user.email?.split('@')[0] || 'User',
        },
        customizations: {
          title: 'Ad Generator Pro',
          description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
          logo: 'https://lovable.app/favicon.ico',
        },
        meta: {
          user_id: user.id,
          plan: plan,
          interval: planDetails.interval,
        },
      }),
    })

    const flutterwaveData = await flutterwaveResponse.json()
    console.log('Flutterwave response:', flutterwaveData)

    if (flutterwaveData.status !== 'success') {
      throw new Error(`Flutterwave error: ${flutterwaveData.message}`)
    }

    return new Response(
      JSON.stringify({
        checkout_url: flutterwaveData.data.link,
        tx_ref: flutterwaveData.data.tx_ref || `sub_${user.id}_${Date.now()}`,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating checkout:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})