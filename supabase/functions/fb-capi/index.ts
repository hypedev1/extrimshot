// @ts-nocheck
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FB_PIXEL_IDS = [
  { id: '1119431000005922', tokenEnv: 'FB_CAPI_ACCESS_TOKEN_2' },
];
const FB_API_VERSION = 'v18.0';
const DEFAULT_ACCESS_TOKEN = 'EAATkTKQD3NkBSfPAItB4ivqd32nfbQnU8m3jaqsjsjwiwmxs6oZBaWTGTo6KhZBb4q67cNx9lffSNgKkZCDVvFQyfBkIzTik3lahCipy4ZCgM0z1wTx7GsggBsv0UwhutBiqiyc2mndTqxOr9xMelEpFyOQZBcUXB4zy83MlOdaWZCqGk95hIKc6EHe3TY1QZDZD';

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
  pixel_id?: string;
  access_token?: string;
  test_event_code?: string;
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
    const body: RequestBody = await req.json();
    const { event_name, event_id, event_source_url, user_data, custom_data } = body;

    // Get client IP from headers (Cloudflare or standard proxy)
    const clientIp = req.headers.get('cf-connecting-ip') ||
                     req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip');

    // Prepare user data with hashing
    const hashedUserData: EventData['user_data'] = {
      client_user_agent: user_data?.client_user_agent || req.headers.get('user-agent') || '',
    };

    // Only set client_ip_address if valid — never send 'unknown' to Meta
    if (clientIp && clientIp !== 'unknown') {
      hashedUserData.client_ip_address = clientIp;
    }

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

    const generatedEventId = event_id || `server_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const eventData: EventData = {
      event_name,
      event_id: generatedEventId,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: event_source_url || 'https://extrimshot.com',
      action_source: 'website',
      user_data: hashedUserData,
    };

    if (custom_data) {
      eventData.custom_data = {
        currency: custom_data.currency || 'BDT',
        value: custom_data.value,
        content_name: custom_data.content_name,
        content_type: 'product',
        order_id: custom_data.order_id,
      };
    }

    console.log('Sending event to Facebook CAPI:', event_name, 'with event_id:', generatedEventId);

    // Determine which pixels to send to:
    // If request explicitly specifies pixel_id or META_PIXEL_ID is in env, target that pixel;
    // otherwise send to all configured FB_PIXEL_IDS
    const targetPixelId = body.pixel_id || Deno.env.get('META_PIXEL_ID');
    const pixelsToSend = targetPixelId
      ? [{ id: targetPixelId, tokenEnv: 'FB_CAPI_ACCESS_TOKEN_2' }]
      : FB_PIXEL_IDS;

    const testEventCode = body.test_event_code || Deno.env.get('META_TEST_EVENT_CODE');

    // Send to pixels
    const results = await Promise.all(
      pixelsToSend.map(async ({ id, tokenEnv }) => {
        // Resolve access token with cascading fallbacks:
        // 1. Explicit body access_token
        // 2. META_ACCESS_TOKEN from env
        // 3. Pixel-specific token env (FB_CAPI_ACCESS_TOKEN_2, etc.)
        // 4. Global FB_CAPI_ACCESS_TOKEN
        const accessToken = 
          body.access_token ||
          Deno.env.get('META_ACCESS_TOKEN') ||
          Deno.env.get(tokenEnv) ||
          Deno.env.get('FB_CAPI_ACCESS_TOKEN') ||
          DEFAULT_ACCESS_TOKEN;

        if (!accessToken) {
          console.warn(`No access token available for pixel ${id}, skipping`);
          return { pixelId: id, success: false, error: 'Token not configured' };
        }

        try {
          const payload: Record<string, any> = {
            data: [eventData],
            access_token: accessToken,
          };

          if (testEventCode) {
            payload.test_event_code = testEventCode;
          }

          const fbResponse = await fetch(
            `https://graph.facebook.com/${FB_API_VERSION}/${id}/events`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            }
          );

          const fbResult = await fbResponse.json();
          console.log(`Facebook CAPI response for pixel ${id}:`, JSON.stringify(fbResult));

          if (!fbResponse.ok) {
            return { pixelId: id, success: false, error: fbResult };
          }

          return { pixelId: id, success: true, result: fbResult };
        } catch (err: any) {
          console.error(`Error sending to pixel ${id}:`, err);
          return { pixelId: id, success: false, error: err.message };
        }
      })
    );

    return new Response(JSON.stringify({ success: true, results }), {
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

