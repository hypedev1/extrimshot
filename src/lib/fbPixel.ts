import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

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

// Track event on frontend (browser pixel)
export const trackPixelEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  }
};

// Track event via server-side CAPI
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
  }
) => {
  try {
    const { fbc, fbp } = getFbCookies();
    
    await supabase.functions.invoke('fb-capi', {
      body: {
        event_name: eventName,
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

// Combined tracking - both browser and server
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
  // Browser pixel
  trackPixelEvent(eventName, customData);
  
  // Server-side CAPI
  await trackCAPIEvent(eventName, userData, customData);
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

export const trackLead = async (userData: { phone?: string; name?: string }) => {
  await trackEvent('Lead', userData);
};
