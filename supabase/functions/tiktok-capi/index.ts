import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TIKTOK_PIXEL_ID = 'D6EC8NRC77UDFNKRIQH0';
const TIKTOK_API_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

interface RequestBody {
  event: string;
  event_id?: string;
  event_source_url?: string;
  user_data?: {
    phone?: string;
    name?: string;
    client_user_agent?: string;
    ttp?: string;
    ttclid?: string;
  };
  properties?: {
    currency?: string;
    value?: number;
    content_name?: string;
    content_id?: string;
    content_type?: string;
    order_id?: string;
  };
}

async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('TIKTOK_CAPI_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('TIKTOK_CAPI_ACCESS_TOKEN not configured');
    }

    const rawText = await req.text();
    let body: RequestBody;
    try {
      body = rawText ? JSON.parse(rawText) : ({} as RequestBody);
    } catch (parseErr) {
      console.error('Invalid JSON body received:', rawText?.slice(0, 200));
      return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { event, event_id, event_source_url, user_data, properties } = body;
    if (!event) {
      return new Response(JSON.stringify({ success: false, error: 'Missing event' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // TikTok rejects a non-IP string such as 'unknown' with a plain-text error
    // body, which then breaks the JSON parsing below. Omit the field instead.
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('x-real-ip')?.trim() ||
                     '';

    // Build user object with hashed PII
    const userObj: Record<string, any> = {
      user_agent: user_data?.client_user_agent || req.headers.get('user-agent') || '',
    };
    if (clientIp) userObj.ip = clientIp;

    if (user_data?.phone) {
      let phone = user_data.phone.replace(/\D/g, '');
      if (phone.startsWith('0')) {
        phone = '88' + phone;
      } else if (!phone.startsWith('88')) {
        phone = '88' + phone;
      }
      // Events API 2.0 names this field `phone`. The old `phone_number` key is
      // the deprecated v1.2 spelling and is silently dropped, which zeroes out
      // match quality for every server event.
      userObj.phone = await hashData(phone);
    }

    // Pass TikTok click ID and cookie for attribution
    if (user_data?.ttclid) userObj.ttclid = user_data.ttclid;
    if (user_data?.ttp) userObj.ttp = user_data.ttp;

    // Build properties/contents
    const eventProperties: Record<string, any> = {};
    const contents: any[] = [];

    if (properties) {
      if (properties.currency) eventProperties.currency = properties.currency;
      if (properties.value !== undefined) eventProperties.value = properties.value;
      if (properties.order_id) eventProperties.order_id = properties.order_id;

      if (properties.content_name || properties.content_id) {
        contents.push({
          content_id: properties.content_id || 'extrimshot',
          content_name: properties.content_name || 'Extrimshot',
          content_type: properties.content_type || 'product',
          quantity: 1,
          price: properties.value,
        });
        eventProperties.contents = contents;
        eventProperties.content_type = properties.content_type || 'product';
      }
    }

    const generatedEventId = event_id || `tt_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Events API 2.0 shape: `user` and `page` sit directly on the event object.
    // The `context` wrapper and `pixel_code` belong to the retired v1.2 payload
    // and are ignored once `event_source` / `event_source_id` are sent, so the
    // whole user block was being discarded by TikTok.
    const payload: Record<string, any> = {
      event: event,
      event_id: generatedEventId,
      event_time: Math.floor(Date.now() / 1000),
      user: userObj,
      page: {
        url: event_source_url || 'https://www.extrimshot.shop',
      },
      properties: eventProperties,
    };

    const testEventCode = Deno.env.get('TIKTOK_TEST_EVENT_CODE');
    if (testEventCode) payload.test_event_code = testEventCode;

    console.log('Sending TikTok CAPI event:', event, 'event_id:', generatedEventId);

    const ttResponse = await fetch(TIKTOK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': accessToken,
      },
      body: JSON.stringify({
        event_source: 'web',
        event_source_id: TIKTOK_PIXEL_ID,
        data: [payload],
      }),
    });

    // TikTok answers some rejections with plain text, so parsing straight to
    // JSON throws and the whole call surfaces as an opaque 500.
    const ttRaw = await ttResponse.text();
    let ttResult: any;
    try {
      ttResult = JSON.parse(ttRaw);
    } catch (_) {
      ttResult = { non_json_response: ttRaw, http_status: ttResponse.status };
    }
    console.log('TikTok CAPI response:', JSON.stringify(ttResult));

    return new Response(JSON.stringify({ success: true, result: ttResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in tiktok-capi function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
