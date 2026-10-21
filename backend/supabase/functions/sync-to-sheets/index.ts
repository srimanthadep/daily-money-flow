import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { date, user_id } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: snapshot, error: fetchError } = await supabase
      .from('daily_snapshots')
      .select('data')
      .eq('date', date)
      .eq('user_id', user_id)
      .maybeSingle()

    if (fetchError || !snapshot) {
      throw new Error(`Data not found for ${date}: ${fetchError?.message}`)
    }

    const entries = snapshot.data as any[]
    const SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEET_ID')
    
    let serviceAccountRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT') || '{}'
    console.log("Raw Service Account Length:", serviceAccountRaw.length)
    
    // Clean up potential shell artifacts
    serviceAccountRaw = serviceAccountRaw.trim()
    if (serviceAccountRaw.startsWith("'") && serviceAccountRaw.endsWith("'")) {
      serviceAccountRaw = serviceAccountRaw.slice(1, -1)
    }

    const SERVICE_ACCOUNT = JSON.parse(serviceAccountRaw)

    // 1. Generate JWT for Google Auth
    const header = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    const now = Math.floor(Date.now() / 1000)
    const claim = b64(JSON.stringify({
      iss: SERVICE_ACCOUNT.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    }))

    const key = await crypto.subtle.importKey(
      "pkcs8",
      pemToBinary(SERVICE_ACCOUNT.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    )

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(`${header}.${claim}`)
    )

    const jwt = `${header}.${claim}.${b64(signature)}`

    // 2. Get Access Token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt
      })
    })
    const { access_token } = await tokenRes.json()

    // 3. Append to Sheets
    const rows = entries.map(e => [
      date,
      e.name,
      e.amount,
      e.status,
      e.notes || '',
      e.updatedAt
    ])

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!A:F:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ values: rows })
      }
    )

    const result = await res.json()
    if (result.error) throw new Error(result.error.message)

    return new Response(
      JSON.stringify({ message: `Successfully synced ${rows.length} rows to Google Sheets` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function b64(data: any) {
  const base64 = typeof data === "string" ? btoa(data) : btoa(String.fromCharCode(...new Uint8Array(data)))
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function pemToBinary(pem: string) {
  const base64 = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s/g, "")
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}
