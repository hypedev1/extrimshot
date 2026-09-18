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

// The single pixel/dataset this site reports to. Configurable via the
// META_PIXEL_ID secret. Other pixel IDs must never receive events, so the
// request body is deliberately not consulted when resolving this.
const DEFAULT_FB_PIXEL_ID = '2151577492375386';
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
    content_type?: string;
    content_ids?: string[];
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
      // content_ids must be forwarded. Dropping it here meant the browser event
      // carried content_ids and the CAPI copy did not, which weakens matching
      // and leaves catalog/dynamic-ads attribution empty.
      eventData.custom_data = {
        currency: custom_data.currency || 'BDT',
        value: custom_data.value,
        content_name: custom_data.content_name,
        content_ids: custom_data.content_ids,
        content_type: custom_data.content_type || 'product',
        order_id: custom_data.order_id,
      };
    }

    console.log('Sending event to Facebook CAPI:', event_name, 'with event_id:', generatedEventId);

    const testEventCode = body.test_event_code || Deno.env.get('META_TEST_EVENT_CODE');

    // Resolved from secrets only. A pixel_id in the request body is ignored so
    // that an old cached browser bundle cannot send events to a legacy pixel.
    const pixelId =
      Deno.env.get('META_PIXEL_ID') ||
      Deno.env.get('VITE_META_PIXEL_ID') ||
      Deno.env.get('FB_PIXEL_ID') ||
      DEFAULT_FB_PIXEL_ID;

    // Always report to the configured pixel.
    const pixelsToSend = [{ id: pixelId }];

    // Send to pixels
    const results = await Promise.all(
      pixelsToSend.map(async ({ id }) => {
        // The token lives only in Supabase secrets. It is never accepted from the
        // request body and is never committed to the repository.
        const accessToken =
          Deno.env.get('META_ACCESS_TOKEN') ||
          Deno.env.get('FB_CAPI_ACCESS_TOKEN');

        if (!accessToken) {
          console.error(`No access token available for pixel ${id}. Set META_ACCESS_TOKEN in Supabase secrets.`);
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

