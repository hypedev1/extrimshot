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
const DEFAULT_FB_PIXEL_ID = '1097868522942660';
const FB_API_VERSION = Deno.env.get('META_API_VERSION') || 'v26.0';

// This endpoint is public, so only the events the site actually sends are
// forwarded to Meta.
const ALLOWED_EVENTS = new Set([
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'Lead',
  'Purchase',
]);

// Every visitor is in Bangladesh. sha256('bd').
const HASHED_COUNTRY_BD = '5e657ff6158d3e2a6d23e2a523917a2305acee9423365e268695c4b7b8919f4c';

interface RequestBody {
  test_event_code?: string;
  event_name: string;
  event_id?: string;
  event_source_url?: string;
  referrer_url?: string;
  user_data?: {
    // Already SHA-256 hashed by the browser.
    ph?: string;
    fn?: string;
    ln?: string;
    external_id?: string | string[];
    country?: string;
    // Raw values, still sent by bundles cached from before browser hashing.
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
    contents?: { id: string; quantity: number; item_price?: number }[];
    num_items?: number;
    order_id?: string;
  };
}

const SHA256_HEX = /^[a-f0-9]{64}$/;

async function sha256(data: string): Promise<string> {
  const dataBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Same rule as normalizeBdPhone in src/lib/fbPixel.ts, so a raw phone from an
// old bundle hashes to the same value as a phone hashed in the browser.
function normalizeBdPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return `88${digits}`;
  if (digits.startsWith('1') && digits.length === 10) return `880${digits}`;
  if (digits.startsWith('88')) return digits;
  return `88${digits}`;
}

const normalizeNamePart = (raw: string) => raw.toLowerCase().replace(/[\p{P}\p{S}]/gu, '').trim();

// Accept a value only when it is a real SHA-256 hash, so garbage never reaches Meta.
const asHash = (value?: string) => {
  const v = value?.trim().toLowerCase();
  return v && SHA256_HEX.test(v) ? v : undefined;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const body: RequestBody = await req.json();
    const { event_name, event_id, event_source_url, referrer_url, user_data, custom_data } = body;

    if (!ALLOWED_EVENTS.has(event_name)) {
      return json({ success: false, error: `Event "${event_name}" is not allowed` }, 400);
    }

    // Get client IP from headers (Cloudflare or standard proxy)
    const clientIp = req.headers.get('cf-connecting-ip') ||
                     req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                     req.headers.get('x-real-ip');

    const userData: Record<string, unknown> = {
      client_user_agent: user_data?.client_user_agent || req.headers.get('user-agent') || '',
    };

    // Only set client_ip_address if valid — never send 'unknown' to Meta
    if (clientIp && clientIp !== 'unknown') {
      userData.client_ip_address = clientIp;
    }

    // Phone: hashed by the browser, or raw from an older cached bundle.
    let ph = asHash(user_data?.ph);
    if (!ph && user_data?.phone) {
      const phone = normalizeBdPhone(user_data.phone);
      if (phone.length >= 12) ph = await sha256(phone);
    }
    if (ph) userData.ph = [ph];

    let fn = asHash(user_data?.fn);
    let ln = asHash(user_data?.ln);
    if (!fn && user_data?.name) {
      const parts = user_data.name.split(/\s+/).map(normalizeNamePart).filter(Boolean);
      if (parts.length > 0) fn = await sha256(parts[0]);
      if (parts.length > 1) ln = await sha256(parts[parts.length - 1]);
    }
    if (fn) userData.fn = [fn];
    if (ln) userData.ln = [ln];

    const externalIds = (Array.isArray(user_data?.external_id) ? user_data.external_id : [user_data?.external_id])
      .map(asHash)
      .filter(Boolean);
    if (ph && !externalIds.includes(ph)) externalIds.push(ph);
    if (externalIds.length > 0) userData.external_id = externalIds;

    userData.country = [asHash(user_data?.country) || HASHED_COUNTRY_BD];

    // Pass through fbc and fbp cookies if present
    if (user_data?.fbc) userData.fbc = user_data.fbc;
    if (user_data?.fbp) userData.fbp = user_data.fbp;

    const generatedEventId = event_id || `server_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const eventData: Record<string, unknown> = {
      event_name,
      event_id: generatedEventId,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: event_source_url || 'https://www.extrimshot.shop',
      action_source: 'website',
      user_data: userData,
    };
    if (referrer_url) eventData.referrer_url = referrer_url;

    if (custom_data) {
      // content_ids must be forwarded. Dropping it here meant the browser event
      // carried content_ids and the CAPI copy did not, which weakens matching
      // and leaves catalog/dynamic-ads attribution empty.
      eventData.custom_data = {
        currency: custom_data.currency || 'BDT',
        value: custom_data.value,
        content_name: custom_data.content_name,
        content_ids: custom_data.content_ids,
        contents: custom_data.contents,
        num_items: custom_data.num_items,
        content_type: custom_data.content_type || 'product',
        order_id: custom_data.order_id,
      };
    }

    // Only a code sent with the request is used. A META_TEST_EVENT_CODE secret
    // used to be read here, and while it was set every real event went to the
    // Test events tab and was ignored by ad delivery.
    const testEventCode = body.test_event_code?.trim() || undefined;
    if (Deno.env.get('META_TEST_EVENT_CODE')) {
      console.warn('META_TEST_EVENT_CODE secret is set but ignored. Delete it from the Supabase secrets.');
    }

    // Resolved from secrets only. A pixel_id in the request body is ignored so
    // that an old cached browser bundle cannot send events to a legacy pixel.
    const pixelId =
      Deno.env.get('META_PIXEL_ID') ||
      Deno.env.get('VITE_META_PIXEL_ID') ||
      Deno.env.get('FB_PIXEL_ID') ||
      DEFAULT_FB_PIXEL_ID;

    // The token lives only in Supabase secrets. It is never accepted from the
    // request body and is never committed to the repository.
    const accessToken =
      Deno.env.get('META_ACCESS_TOKEN') ||
      Deno.env.get('FB_CAPI_ACCESS_TOKEN');

    if (!accessToken) {
      console.error(`No access token available for pixel ${pixelId}. Set META_ACCESS_TOKEN in Supabase secrets.`);
      return json({ success: false, results: [{ pixelId, success: false, error: 'Token not configured' }] }, 500);
    }

    const payload: Record<string, unknown> = {
      data: [eventData],
      access_token: accessToken,
    };
    if (testEventCode) payload.test_event_code = testEventCode;

    let result: Record<string, unknown>;
    try {
      const fbResponse = await fetch(
        `https://graph.facebook.com/${FB_API_VERSION}/${pixelId}/events`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const fbResult = await fbResponse.json().catch(() => ({ non_json_response: true }));

      if (!fbResponse.ok || fbResult?.error) {
        console.error(`Meta CAPI rejected ${event_name} for pixel ${pixelId}:`, JSON.stringify(fbResult));
        result = { pixelId, success: false, error: fbResult?.error || fbResult };
      } else {
        console.log(`Meta CAPI ${event_name} ${generatedEventId} -> pixel ${pixelId}:`, JSON.stringify(fbResult));
        result = { pixelId, success: true, result: fbResult };
      }
    } catch (err: any) {
      console.error(`Error sending ${event_name} to pixel ${pixelId}:`, err);
      result = { pixelId, success: false, error: err.message };
    }

    // A rejection from Meta is reported as a failure instead of success: true,
    // so a broken token or pixel shows up in the browser console and logs.
    return json({ success: result.success, test: Boolean(testEventCode), results: [result] }, result.success ? 200 : 502);
  } catch (error: any) {
    console.error('Error in fb-capi function:', error);
    return json({ success: false, error: error.message }, 500);
  }
});
