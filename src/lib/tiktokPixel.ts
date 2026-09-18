import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    ttq: any;
  }
}

// Generate unique event ID for deduplication between browser pixel & CAPI
const generateEventId = () => {
  return `tt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Get TikTok cookies for attribution
const getTtCookies = () => {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return {
    ttp: cookies['_ttp'] || null,
    ttclid: new URLSearchParams(window.location.search).get('ttclid') || null,
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

// Track event on frontend (browser pixel) with event_id for deduplication
export const trackTtPixelEvent = (eventName: string, params?: Record<string, any>, eventId?: string) => {
  if (!isTrackingAllowed()) return;
  if (typeof window !== 'undefined' && window.ttq) {
    if (eventId) {
      window.ttq.track(eventName, params, { event_id: eventId });
    } else {
      window.ttq.track(eventName, params);
    }
  }
};

// Track event via server-side CAPI with event_id for deduplication
export const trackTtCAPIEvent = async (
  eventName: string,
  userData?: { phone?: string; name?: string },
  properties?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_id?: string;
    content_type?: string;
    order_id?: string;
  },
  eventId?: string
) => {
  if (!isTrackingAllowed()) return;
  try {
    const { ttp, ttclid } = getTtCookies();

    await supabase.functions.invoke('tiktok-capi', {
      body: {
        event: eventName,
        event_id: eventId,
        event_source_url: window.location.href,
        user_data: {
          ...userData,
          client_user_agent: navigator.userAgent,
          ttp,
          ttclid,
        },
        properties,
      },
    });
  } catch (error) {
    console.error('TikTok CAPI tracking error:', error);
  }
};

// Combined tracking — browser pixel + server CAPI with shared event_id
export const trackTtEvent = async (
  eventName: string,
  userData?: { phone?: string; name?: string },
  properties?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_id?: string;
    content_type?: string;
    order_id?: string;
  }
) => {
  const eventId = generateEventId();

  // Browser pixel
  trackTtPixelEvent(eventName, properties, eventId);

  // Server-side CAPI
  await trackTtCAPIEvent(eventName, userData, properties, eventId);
};

// ----- Standard event helpers -----

/**
 * Pageview - browser only.
 * index.html fires ttq.page() on the initial hard load; this covers every
 * later SPA navigation. There is no server-side counterpart because TikTok
 * has no "Pageview" standard event in the Events API, so sending one would be
 * rejected instead of deduplicated.
 */
export const trackTtPageView = () => {
  if (!isTrackingAllowed()) return;
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.page();
  }
};

export const trackTtViewContent = (contentName: string, value?: number) => {
  trackTtEvent('ViewContent', undefined, {
    content_name: contentName,
    value,
    currency: 'BDT',
    content_id: 'extrimshot',
    content_type: 'product',
  });
};

export const trackTtAddToCart = (
  contentName: string,
  value: number,
  contentId?: string
) => {
  trackTtEvent('AddToCart', undefined, {
    content_name: contentName,
    content_id: contentId || 'extrimshot',
    content_type: 'product',
    value,
    currency: 'BDT',
  });
};

/**
 * TikTok's lead-equivalent standard event is SubmitForm. "Lead" is a campaign
 * objective on TikTok, not a pixel event name, so sending "Lead" would land as
 * an unrecognised custom event and could not be used for optimisation.
 */
export const trackTtLead = async (
  userData: { phone?: string; name?: string },
  value?: number
) => {
  await trackTtEvent('SubmitForm', userData, {
    value,
    currency: 'BDT',
    content_name: 'Extrimshot Form Lead',
    content_id: 'extrimshot',
    content_type: 'product',
  });
};

export const trackTtInitiateCheckout = (value: number) => {
  trackTtEvent('InitiateCheckout', undefined, {
    value,
    currency: 'BDT',
    content_name: 'Extrimshot',
    content_id: 'extrimshot',
    content_type: 'product',
  });
};

export const trackTtCompletePayment = async (
  userData: { phone: string; name: string },
  value: number,
  orderId: string
) => {
  await trackTtEvent('CompletePayment', userData, {
    value,
    currency: 'BDT',
    content_name: 'Extrimshot',
    content_id: 'extrimshot',
    order_id: orderId,
  });
};

export const trackTtIncompletePurchase = async (
  userData: { phone: string; name?: string },
  value: number,
  orderId: string
) => {
  await trackTtEvent('CompletePayment', userData, {
    value,
    currency: 'BDT',
    content_name: 'Extrimshot',
    content_id: 'extrimshot',
    order_id: `incomplete_${orderId}`,
  });
};
