import { supabase } from '@/integrations/supabase/client';
import { findBdDistrict } from '@/lib/bdDistricts';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    // Set by the inline snippet in index.html right after its fbq('init').
    __fbPixelInitialized?: string;
  }
}

// Canonical Meta Pixel / dataset ID for this site.
// The browser pixel and the server-side CAPI must both report to this same ID,
// otherwise deduplication breaks and Events Manager shows no matched events.
// Hardcoded on purpose, and kept in sync with index.html: reading it from a
// VITE_ variable let a stale Vercel value initialise a second pixel on the page.
export const FB_PIXEL_ID = '1097868522942660';

// Every visitor is in Bangladesh, so country is always sent. sha256('bd').
const HASHED_COUNTRY_BD = '5e657ff6158d3e2a6d23e2a523917a2305acee9423365e268695c4b7b8919f4c';

// Optional override for the edge-function base URL. Set it to
//   http://127.0.0.1:54321/functions/v1
// in .env while `npx supabase functions serve fb-capi --env-file supabase/functions/.env`
// is running, to exercise the local copy of the function. Unset, the browser
// calls the deployed function, so a stale deployment can silently report events
// to a different pixel than the browser pixel.
const FUNCTIONS_URL_OVERRIDE = (import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string | undefined)?.replace(/\/$/, '');

const invokeFbCapi = async (payload: Record<string, any>) => {
  if (!FUNCTIONS_URL_OVERRIDE) {
    return supabase.functions.invoke('fb-capi', { body: payload });
  }

  const response = await fetch(`${FUNCTIONS_URL_OVERRIDE}/fb-capi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  return response.ok
    ? { data, error: null }
    : { data, error: new Error(`fb-capi returned ${response.status}`) };
};

// The edge function reports back which pixel it sent to. If that is not the
// pixel the browser fires on, the two events can never be deduplicated and the
// canonical dataset stays empty, so make the mismatch loud instead of silent.
const warnOnPixelMismatch = (eventName: string, data: any) => {
  const reported: string[] = Array.isArray(data?.results)
    ? data.results.map((r: any) => r?.pixelId).filter(Boolean)
    : data?.pixelId
      ? [String(data.pixelId)]
      : [];
  const wrong = reported.filter((id) => String(id) !== FB_PIXEL_ID);
  if (wrong.length > 0) {
    console.error(
      `Meta CAPI sent "${eventName}" to pixel ${wrong.join(', ')}, but the browser pixel is ${FB_PIXEL_ID}. ` +
        'Deduplication is broken. Redeploy supabase/functions/fb-capi and set the META_PIXEL_ID secret.'
    );
  }
};

// Generate unique event ID for deduplication between browser pixel and CAPI
export const generateEventId = () => {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

const readCookies = (): Record<string, string> => {
  if (typeof document === 'undefined') return {};
  return document.cookie.split(';').reduce((acc, cookie) => {
    const [key, ...rest] = cookie.trim().split('=');
    if (key) acc[key] = rest.join('=');
    return acc;
  }, {} as Record<string, string>);
};

const writeCookie = (name: string, value: string, days: number) => {
  try {
    document.cookie = `${name}=${value};path=/;max-age=${60 * 60 * 24 * days};SameSite=Lax`;
  } catch (_) {}
};

// Get Facebook cookies for deduplication & high match rates
export const getFbCookies = () => {
  if (typeof document === 'undefined') return { fbc: null, fbp: null };
  const cookies = readCookies();

  // If _fbp doesn't exist yet, generate a valid fbp cookie for Meta CAPI matching
  let fbp = cookies['_fbp'] || null;
  if (!fbp) {
    fbp = `fb.1.${Date.now()}.${Math.floor(Math.random() * 1000000000)}`;
    writeCookie('_fbp', fbp, 90);
  }

  // A new ad click carries a new fbclid. Replace the stored _fbc when the click
  // ID changed, otherwise the conversion is attributed to the previous click.
  let fbc = cookies['_fbc'] || null;
  const fbclid = new URLSearchParams(window.location.search).get('fbclid');
  if (fbclid && (!fbc || !fbc.endsWith(`.${fbclid}`))) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
    writeCookie('_fbc', fbc, 90);
  }

  return { fbc, fbp };
};

// ── Customer information (hashed in the browser) ────────────────────────────
// Meta's Event Match Quality depends on how many customer parameters each
// event carries. Phone, name and address are only typed once, in the order
// form, so their hashes are remembered and attached to every later event, and
// a stable first-party visitor ID is sent as external_id on every event.

const STORED_USER_KEY = '__fb_am';

type HashedUser = { ph?: string; fn?: string; ln?: string; ct?: string; st?: string };

type UserInput = { phone?: string; name?: string; address?: string };

const sha256Hex = async (value: string): Promise<string | undefined> => {
  try {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (_) {
    return undefined;
  }
};

// Meta expects digits only, with country code: 01XXXXXXXXX becomes 8801XXXXXXXXX.
// The edge function applies the same rule, so both sides produce one hash.
export const normalizeBdPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return `88${digits}`;
  if (digits.startsWith('1') && digits.length === 10) return `880${digits}`;
  if (digits.startsWith('88')) return digits;
  return `88${digits}`;
};

// Lowercase, no punctuation or symbols. Bengali letters and marks are kept.
const normalizeNamePart = (raw: string) => raw.toLowerCase().replace(/[\p{P}\p{S}]/gu, '').trim();

const hashUser = async (user: UserInput): Promise<HashedUser> => {
  const hashed: HashedUser = {};
  const phone = user.phone ? normalizeBdPhone(user.phone) : '';
  if (phone.length >= 12) hashed.ph = await sha256Hex(phone);

  const parts = (user.name || '').split(/\s+/).map(normalizeNamePart).filter(Boolean);
  if (parts.length > 0) hashed.fn = await sha256Hex(parts[0]);
  if (parts.length > 1) hashed.ln = await sha256Hex(parts[parts.length - 1]);

  // City (district) and state (division), read from the typed address.
  const place = user.address ? findBdDistrict(user.address) : undefined;
  if (place) {
    hashed.ct = await sha256Hex(place.ct);
    hashed.st = await sha256Hex(place.st);
  }
  return hashed;
};

const readStoredUser = (): HashedUser & { external_id?: string } => {
  try {
    return JSON.parse(localStorage.getItem(STORED_USER_KEY) || '{}') || {};
  } catch (_) {
    return {};
  }
};

// index.html reads this same key and passes it to fbq('init'), so returning
// visitors also get browser-side advanced matching.
const writeStoredUser = (value: HashedUser & { external_id?: string }) => {
  try {
    localStorage.setItem(STORED_USER_KEY, JSON.stringify({ ...value, country: HASHED_COUNTRY_BD }));
  } catch (_) {}
};

const getVisitorId = (): string => {
  const cookies = readCookies();
  let id = cookies['_ext_vid'];
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  // Rewritten on every event, so browsers that cap script-set cookies (Safari
  // keeps them 7 days) still keep the ID while the visitor stays active.
  writeCookie('_ext_vid', id, 400);
  return id;
};

const buildUserData = async (user?: UserInput) => {
  const stored = readStoredUser();
  const fresh = user ? await hashUser(user) : {};
  const merged: HashedUser = {
    ph: fresh.ph || stored.ph,
    fn: fresh.fn || stored.fn,
    ln: fresh.ln || stored.ln,
    ct: fresh.ct || stored.ct,
    st: fresh.st || stored.st,
  };

  const visitorHash = await sha256Hex(getVisitorId());

  if (visitorHash && (fresh.ph || fresh.fn || fresh.ct || stored.external_id !== visitorHash)) {
    writeStoredUser({ ...merged, external_id: visitorHash });
  }

  // The visitor ID links every event from this browser; the phone hash links
  // the same person across devices once they have filled in the form.
  const externalIds = [visitorHash, merged.ph].filter(Boolean) as string[];
  const { fbc, fbp } = getFbCookies();

  return {
    ...merged,
    external_id: externalIds,
    country: HASHED_COUNTRY_BD,
    client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    fbc,
    fbp,
  };
};

// Opening the site with ?test_event_code=TEST12345 sends that session's CAPI
// events to Events Manager > Test events, and nothing else does. A test code
// stored as a server secret would silently divert every real event.
const getTestEventCode = (): string | undefined => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('test_event_code');
    if (fromUrl) sessionStorage.setItem('fb_test_event_code', fromUrl);
    return sessionStorage.getItem('fb_test_event_code') || undefined;
  } catch (_) {
    return undefined;
  }
};

// Helper to check if tracking should be allowed. Skips builder previews and the
// admin panel, whose staff traffic would otherwise pollute audiences.
export const isTrackingAllowed = () => {
  if (typeof window === 'undefined') return true;
  if (import.meta.env.VITE_DISABLE_TRACKING === 'true') return false;
  const host = window.location.hostname.toLowerCase();
  if (
    host.includes('lovableproject.com') ||
    host.includes('lovable.dev') ||
    host.includes('webcontainer.io')
  ) {
    return false;
  }
  if (window.location.pathname.startsWith('/admin')) return false;
  return true;
};

// fbq('init') must run exactly once per page. Re-running it makes Meta Pixel
// Helper report a duplicate pixel and can suppress events.
let pixelInitialized = false;

// Ensure Pixel is initialized with the current FB_PIXEL_ID
export const ensurePixelInit = () => {
  if (!isTrackingAllowed()) return;
  if (typeof window === 'undefined') return;
  if (pixelInitialized) return;

  // Initialize stub if not loaded yet
  if (!window.fbq) {
    (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s?.parentNode?.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  }

  // index.html already ran fbq('init') before React booted. Initialising any
  // pixel again here is what put a second pixel on the page, so never do it.
  if (window.__fbPixelInitialized) {
    pixelInitialized = true;
    return;
  }

  if (window.fbq) {
    window.fbq('init', FB_PIXEL_ID);
    window.__fbPixelInitialized = FB_PIXEL_ID;
    pixelInitialized = true;
  }
};

// Track event on frontend (browser pixel) with eventID for deduplication
export const trackPixelEvent = (eventName: string, params?: Record<string, any>, eventId?: string) => {
  if (!isTrackingAllowed()) return;
  ensurePixelInit();

  if (typeof window !== 'undefined' && window.fbq) {
    if (import.meta.env.DEV) {
      console.log(
        '%c[Meta Pixel]%c Fired: ' + eventName,
        'background: #1877F2; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
        'color: #059669; font-weight: bold; margin-left: 6px;',
        { eventId, params }
      );
    }
    if (eventId) {
      window.fbq('track', eventName, params || {}, { eventID: eventId });
    } else {
      window.fbq('track', eventName, params || {});
    }
  }
};

type CustomData = {
  value?: number;
  currency?: string;
  content_name?: string;
  content_type?: string;
  content_ids?: string[];
  contents?: { id: string; quantity: number; item_price?: number }[];
  num_items?: number;
  order_id?: string;
};

// Track event via server-side CAPI with eventID for deduplication
export const trackCAPIEvent = async (
  eventName: string,
  userData?: UserInput,
  customData?: CustomData,
  eventId?: string
) => {
  if (!isTrackingAllowed()) return;
  try {
    // Neither the access token nor raw phone/name leaves the browser: customer
    // fields are SHA-256 hashed here and the token lives in Supabase secrets.
    const { data, error } = await invokeFbCapi({
      event_name: eventName,
      event_id: eventId,
      // Older deployed versions of the edge function honoured this field. The
      // current version resolves the pixel from secrets and ignores it.
      pixel_id: FB_PIXEL_ID,
      event_source_url: typeof window !== 'undefined' ? window.location.href : 'https://www.extrimshot.shop',
      referrer_url: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      test_event_code: getTestEventCode(),
      user_data: await buildUserData(userData),
      custom_data: customData,
    });

    if (error) {
      console.warn('Meta CAPI invoke error:', eventName, error, data);
    } else {
      if (import.meta.env.DEV) console.log('Meta CAPI response:', eventName, data);
      warnOnPixelMismatch(eventName, data);
    }
  } catch (error) {
    console.error('CAPI tracking error:', error);
  }
};

// Combined tracking - both browser and server with shared eventId for deduplication
export const trackEvent = async (
  eventName: string,
  userData?: UserInput,
  customData?: CustomData
) => {
  // Generate unique event ID for deduplication
  const eventId = generateEventId();

  // Browser pixel with eventID
  trackPixelEvent(eventName, customData, eventId);

  // Server-side CAPI with exact same eventID
  await trackCAPIEvent(eventName, userData, customData, eventId);

  return eventId;
};

const productData = (contentId: string, value?: number, contentName?: string): CustomData => ({
  content_name: contentName,
  content_ids: [contentId],
  contents: [{ id: contentId, quantity: 1, ...(value !== undefined ? { item_price: value } : {}) }],
  num_items: 1,
  content_type: 'product',
  value,
  currency: 'BDT',
});

// ── Standard Events ──────────────────────────────────────────────────────────

/**
 * 1. PageView - Triggered on page loads and client route navigation
 */
export const trackPageView = (_url?: string) => {
  const eventId = generateEventId();
  trackPixelEvent('PageView', undefined, eventId);
  void trackCAPIEvent('PageView', undefined, undefined, eventId);
};

/**
 * 2. ViewContent - Triggered when viewing the product details
 */
export const trackViewContent = (
  contentName: string,
  value?: number,
  contentId: string = 'powerbooster'
) => {
  trackEvent('ViewContent', undefined, productData(contentId, value, contentName));
};

/**
 * 3. AddToCart - Triggered when selecting or switching packages
 */
export const trackAddToCart = (
  contentName: string,
  value: number,
  contentId: string = 'powerbooster'
) => {
  trackEvent('AddToCart', undefined, productData(contentId, value, contentName));
};

/**
 * 4. InitiateCheckout - Triggered when the user reaches or views the order form
 */
export const trackInitiateCheckout = (
  value: number,
  packageName?: string,
  contentId: string = 'powerbooster'
) => {
  trackEvent('InitiateCheckout', undefined, productData(contentId, value, packageName || 'Extrimshot'));
};

/**
 * 5. Lead - Triggered when the user provides contact details (phone number).
 * Also the event to build abandoned-order audiences from (Lead without Purchase).
 */
export const trackLead = async (
  userData: UserInput,
  value?: number,
  contentId: string = 'powerbooster'
) => {
  await trackEvent('Lead', userData, {
    ...productData(contentId, value, 'Extrimshot Form Lead'),
  });
};

/**
 * 6. Purchase - Triggered only when an order is saved in the orders table
 */
export const trackPurchase = async (
  userData: UserInput & { phone: string; name: string },
  value: number,
  orderId: string,
  packageName?: string,
  contentId: string = 'powerbooster'
) => {
  await trackEvent('Purchase', userData, {
    ...productData(contentId, value, packageName || 'Extrimshot'),
    order_id: orderId,
  });
};
