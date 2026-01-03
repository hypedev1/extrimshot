import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

// Generate unique event ID for deduplication
const generateEventId = () => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Get Facebook cookies for deduplication
const getFbCookies = () => {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return {
    fbc: cookies['_fbc'] || null,
    fbp: cookies['_fbp'] || null,
  };
};

// Track event on frontend (browser pixel) with eventID for deduplication
export const trackPixelEvent = (eventName: string, params?: Record<string, any>, eventId?: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
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
    
    await supabase.functions.invoke('fb-capi', {
      body: {
        event_name: eventName,
        event_id: eventId,
        event_source_url: window.location.href,
        user_data: {
          ...userData,
          client_user_agent: navigator.userAgent,
          fbc,
          fbp,
        },
        custom_data: customData,
      },
    });
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

// Track incomplete order as Lead event to Facebook (NOT Purchase)
export const trackIncompleteLead = async (
  userData: { phone: string; name?: string },
  value: number,
  incompleteOrderId: string
) => {
  await trackEvent('Lead', userData, {
    value,
    currency: 'BDT',
    content_name: 'Incomplete Order',
    order_id: `incomplete_${incompleteOrderId}`,
  });
};

export const trackLead = async (userData: { phone?: string; name?: string }) => {
  await trackEvent('Lead', userData);
};
