import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

// Meta Pixel ID (hardcoded to match the single pixel we use)
export const FB_PIXEL_ID = '1119431000005922';

// Generate unique event ID for deduplication
const generateEventId = () => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Get Facebook cookies for deduplication
const getFbCookies = () => {
  if (typeof document === 'undefined') return { fbc: null, fbp: null };
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return {
    fbc: cookies['_fbc'] || null,
    fbp: cookies['_fbp'] || null,
  };
};

// Ensure Pixel is initialized with the current FB_PIXEL_ID
export const ensurePixelInit = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('init', FB_PIXEL_ID);
  }
};

// Track event on frontend (browser pixel) with eventID for deduplication
export const trackPixelEvent = (eventName: string, params?: Record<string, any>, eventId?: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
    ensurePixelInit();
    if (eventId) {
      window.fbq('track', eventName, params, { eventID: eventId });
    } else {
      window.fbq('track', eventName, params);
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
    order_id?: string;
  },
  eventId?: string
) => {
  try {
    const { fbc, fbp } = getFbCookies();
    
    const { data, error } = await supabase.functions.invoke('fb-capi', {
      body: {
        pixel_id: FB_PIXEL_ID,
        event_name: eventName,
        event_id: eventId,
        event_source_url: typeof window !== 'undefined' ? window.location.href : 'https://extrimshot.com',
        user_data: {
          ...userData,
          client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          fbc,
          fbp,
        },
        custom_data: customData,
      },
    });

    if (error) {
      console.warn('Meta CAPI invoke error:', error);
    } else {
      console.log('Meta CAPI response:', eventName, data);
    }
  } catch (error) {
    console.error('CAPI tracking error:', error);
  }
};

// Combined tracking - both browser and server with deduplication
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
    order_id?: string;
  }
) => {
  // Generate unique event ID for deduplication
  const eventId = generateEventId();
  
  // Browser pixel with eventID
  trackPixelEvent(eventName, customData, eventId);
  
  // Server-side CAPI with same eventID
  await trackCAPIEvent(eventName, userData, customData, eventId);
};

// Standard events
export const trackPageView = () => trackPixelEvent('PageView');

export const trackViewContent = (contentName: string, value?: number) => {
  trackEvent('ViewContent', undefined, {
    content_name: contentName,
    value,
    currency: 'BDT',
  });
};

export const trackInitiateCheckout = (value: number) => {
  trackEvent('InitiateCheckout', undefined, {
    value,
    currency: 'BDT',
    content_name: 'Extrimshot',
  });
};

export const trackPurchase = async (
  userData: { phone: string; name: string },
  value: number,
  orderId: string
) => {
  await trackEvent('Purchase', userData, {
    value,
    currency: 'BDT',
    content_name: 'Extrimshot',
    order_id: orderId,
  });
};

// Track incomplete order as Purchase event to Facebook
export const trackIncompletePurchase = async (
  userData: { phone: string; name?: string },
  value: number,
  incompleteOrderId: string
) => {
  await trackEvent('Purchase', userData, {
    value,
    currency: 'BDT',
    content_name: 'Extrimshot',
    order_id: `incomplete_${incompleteOrderId}`,
  });
};

export const trackLead = async (userData: { phone?: string; name?: string }) => {
  await trackEvent('Lead', userData);
};
