import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FB_PIXEL_ID = '1119431000005922';
const FB_API_VERSION = 'v18.0';

interface EventData {
  event_name: string;
  event_id?: string;
  event_time?: number;
  event_source_url?: string;
  action_source?: string;
  user_data?: {
    em?: string;
    ph?: string;
    fn?: string;
    ln?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    order_id?: string;
  };
}

interface RequestBody {
  event_name: string;
  event_id?: string;
  event_source_url?: string;
  user_data?: {
    phone?: string;
    name?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_name?: string;
    order_id?: string;
  };
}

// Hash function for user data
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('FB_CAPI_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('FB_CAPI_ACCESS_TOKEN not configured');
    }

    const body: RequestBody = await req.json();
    const { event_name, event_id, event_source_url, user_data, custom_data } = body;

    // Get client IP from headers
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Prepare user data with hashing
    const hashedUserData: EventData['user_data'] = {
      client_ip_address: clientIp,
      client_user_agent: user_data?.client_user_agent || req.headers.get('user-agent') || '',
    };

    if (user_data?.phone) {
      // Format phone for Bangladesh (remove leading 0, add country code)
      let phone = user_data.phone.replace(/\D/g, '');
      if (phone.startsWith('0')) {
        phone = '88' + phone;
      } else if (!phone.startsWith('88')) {
        phone = '88' + phone;
      }
      hashedUserData.ph = await hashData(phone);
    }

    if (user_data?.name) {
      const names = user_data.name.trim().split(' ');
      if (names.length > 0) {
        hashedUserData.fn = await hashData(names[0]);
        if (names.length > 1) {
          hashedUserData.ln = await hashData(names[names.length - 1]);
        }
      }
    }

    // Pass through fbc and fbp cookies if present
    if (user_data?.fbc) hashedUserData.fbc = user_data.fbc;
    if (user_data?.fbp) hashedUserData.fbp = user_data.fbp;

    const eventData: EventData = {
      event_name,
      event_id: event_id || `server_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: event_source_url || 'https://extrimshot.com',
      action_source: 'website',
      user_data: hashedUserData,
    };

    console.log('Sending event to Facebook CAPI:', event_name, 'with event_id:', eventData.event_id);

    if (custom_data) {
      eventData.custom_data = {
        currency: custom_data.currency || 'BDT',
        value: custom_data.value,
        content_name: custom_data.content_name,
        content_type: 'product',
        order_id: custom_data.order_id,
      };
    }

    console.log('Sending event to Facebook CAPI:', event_name);

    const fbResponse = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/${FB_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [eventData],
          access_token: accessToken,
        }),
      }
    );

    const fbResult = await fbResponse.json();
    console.log('Facebook CAPI response:', JSON.stringify(fbResult));

    if (!fbResponse.ok) {
      throw new Error(`Facebook API error: ${JSON.stringify(fbResult)}`);
    }

    return new Response(JSON.stringify({ success: true, result: fbResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in fb-capi function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
