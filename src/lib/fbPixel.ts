import { supabase } from '@/integrations/supabase/client';

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
// Keep this value in sync with the hardcoded ID in index.html.
export const FB_PIXEL_ID =
  (import.meta.env.VITE_META_PIXEL_ID as string) || '1415986030495223';

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

// Get Facebook cookies for deduplication & high match rates
export const getFbCookies = () => {
  if (typeof document === 'undefined') return { fbc: null, fbp: null };
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  // If _fbp doesn't exist yet, generate a valid fbp cookie for Meta CAPI matching
  let fbp = cookies['_fbp'] || null;
  if (!fbp && typeof window !== 'undefined') {
    fbp = `fb.1.${Date.now()}.${Math.floor(Math.random() * 1000000000)}`;
    try {
      document.cookie = `_fbp=${fbp};path=/;max-age=${60 * 60 * 24 * 90};SameSite=Lax`;
    } catch (_) {}
  }

  // Capture fbclid from URL if _fbc not already set
  let fbc = cookies['_fbc'] || null;
  if (!fbc && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid');
    if (fbclid) {
      fbc = `fb.1.${Date.now()}.${fbclid}`;
      try {
        document.cookie = `_fbc=${fbc};path=/;max-age=${60 * 60 * 24 * 90};SameSite=Lax`;
      } catch (_) {}
    }
  }

  return {
    fbc,
    fbp,
  };
};

// Helper to check if tracking should be allowed (only ignore builder preview iframes)
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

  // index.html already ran fbq('init') for the same pixel before React booted.
  // Re-initialising it here is what makes Meta Pixel Helper report a duplicate
  // pixel on the page, so only init when the inline snippet did not.
  if (window.__fbPixelInitialized === FB_PIXEL_ID) {
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

// Track event via server-side CAPI with eventID for deduplication
export const trackCAPIEvent = async (
  eventName: string,
  userData?: {
    phone?: string;
    name?: string;
  },
  customData?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_type?: string;
    content_ids?: string[];
    order_id?: string;
  },
  eventId?: string
) => {
  if (!isTrackingAllowed()) return;
  try {
    const { fbc, fbp } = getFbCookies();

    // Neither the pixel ID nor the access token is sent from the browser.
    // The edge function resolves both from Supabase secrets, so a stale cached
    // bundle can never redirect events to a different pixel, and the token
    // never reaches the client bundle.
    const { data, error } = await invokeFbCapi({
      event_name: eventName,
      event_id: eventId,
      // The currently deployed edge function still targets an older pixel and
      // honours this field, so sending it keeps browser and server events on the
      // same dataset without a redeploy. The version in supabase/functions/fb-capi
      // resolves the pixel from secrets and ignores this field, so it stays
      // correct after that version ships.
      pixel_id: FB_PIXEL_ID,
      event_source_url: typeof window !== 'undefined' ? window.location.href : 'https://extrimshot.com',
      user_data: {
        ...userData,
        client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        fbc,
        fbp,
      },
      custom_data: customData,
    });

    if (error) {
      console.warn('Meta CAPI invoke error:', error);
    } else {
      console.log('Meta CAPI response:', eventName, data);
      warnOnPixelMismatch(eventName, data);
    }
  } catch (error) {
    console.error('CAPI tracking error:', error);
  }
};

// Combined tracking - both browser and server with shared eventId for deduplication
export const trackEvent = async (
  eventName: string,
  userData?: {
    phone?: string;
    name?: string;
  },
  customData?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_type?: string;
    content_ids?: string[];
    order_id?: string;
  }
) => {
  // Generate unique event ID for deduplication
  const eventId = generateEventId();
  
  // Browser pixel with eventID
  trackPixelEvent(eventName, customData, eventId);
  
  // Server-side CAPI with exact same eventID
  await trackCAPIEvent(eventName, userData, customData, eventId);

  return eventId;
};

// ── Standard Events ──────────────────────────────────────────────────────────

/**
 * 1. PageView - Triggered on page loads and client route navigation
 */
export const trackPageView = (url?: string) => {
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
  trackEvent('ViewContent', undefined, {
    content_name: contentName,
    content_ids: [contentId],
    content_type: 'product',
    value,
    currency: 'BDT',
  });
};

/**
 * 3. AddToCart - Triggered when selecting or switching packages / clicking CTA
 */
export const trackAddToCart = (
  contentName: string,
  value: number,
  packageId?: string
) => {
  trackEvent('AddToCart', undefined, {
    content_name: contentName,
    content_ids: packageId ? [packageId] : ['powerbooster'],
    content_type: 'product',
    value,
    currency: 'BDT',
  });
};

/**
 * 4. InitiateCheckout - Triggered when the user reaches or views the order form
 */
export const trackInitiateCheckout = (value: number, packageName?: string) => {
  trackEvent('InitiateCheckout', undefined, {
    value,
    currency: 'BDT',
    content_name: packageName || 'Extrimshot',
    content_type: 'product',
  });
};

/**
 * 5. Lead - Triggered when the user provides contact details (phone number)
 */
export const trackLead = async (
  userData: { phone?: string; name?: string },
  value?: number
) => {
  await trackEvent('Lead', userData, {
    value,
    currency: 'BDT',
    content_name: 'Extrimshot Form Lead',
  });
};

/**
 * 6. Purchase - Triggered when order is successfully placed
 */
export const trackPurchase = async (
  userData: { phone: string; name: string },
  value: number,
  orderId: string,
  packageName?: string
) => {
  await trackEvent('Purchase', userData, {
    value,
    currency: 'BDT',
    content_name: packageName || 'Extrimshot',
    content_type: 'product',
    order_id: orderId,
  });
};

/**
 * Track incomplete order as Purchase event to Facebook for abandoned cart retargeting
 */
export const trackIncompletePurchase = async (
  userData: { phone: string; name?: string },
  value: number,
  incompleteOrderId: string
) => {
  await trackEvent('Purchase', userData, {
    value,
    currency: 'BDT',
    content_name: 'Extrimshot',
    content_type: 'product',
    order_id: `incomplete_${incompleteOrderId}`,
  });
};
