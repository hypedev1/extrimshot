import { supabase } from '@/integrations/supabase/client';

interface DeviceInfo {
  fingerprint: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

interface FraudCheckResult {
  allowed: boolean;
  reason?: string;
  hoursRemaining?: number;
}

const RATE_LIMIT_HOURS = 24;

export const getClientIP = async (): Promise<string | null> => {
  try {
    // Add timeout to prevent hanging on slow networks
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    // Silently fail - IP check is optional
    console.warn('IP fetch skipped:', error);
    return null;
  }
};

export const checkFraudPrevention = async (
  deviceInfo: DeviceInfo,
  phone: string,
  ipAddress: string | null
): Promise<FraudCheckResult> => {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - RATE_LIMIT_HOURS);
  const cutoffISO = cutoffTime.toISOString();

  try {
    // Check 1: Same device fingerprint within 24 hours
    const { data: fingerprintMatch, error: fpError } = await supabase
      .from('order_fingerprints')
      .select('created_at')
      .eq('fingerprint', deviceInfo.fingerprint)
      .gte('created_at', cutoffISO)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fpError) {
      console.error('Fingerprint check error:', fpError);
    }

    if (fingerprintMatch && fingerprintMatch.length > 0) {
      const lastOrder = new Date(fingerprintMatch[0].created_at);
      const hoursRemaining = Math.ceil((lastOrder.getTime() + RATE_LIMIT_HOURS * 60 * 60 * 1000 - Date.now()) / (60 * 60 * 1000));
      return {
        allowed: false,
        reason: 'এই ডিভাইস থেকে ইতোমধ্যে অর্ডার করা হয়েছে। ২৪ ঘণ্টা পর আবার চেষ্টা করুন।',
        hoursRemaining
      };
    }

    // Check 2: Same IP address within 24 hours (if available)
    if (ipAddress) {
      const { data: ipMatch, error: ipError } = await supabase
        .from('order_fingerprints')
        .select('created_at')
        .eq('ip_address', ipAddress)
        .gte('created_at', cutoffISO)
        .order('created_at', { ascending: false })
        .limit(1);

      if (ipError) {
        console.error('IP check error:', ipError);
      }

      if (ipMatch && ipMatch.length > 0) {
        const lastOrder = new Date(ipMatch[0].created_at);
        const hoursRemaining = Math.ceil((lastOrder.getTime() + RATE_LIMIT_HOURS * 60 * 60 * 1000 - Date.now()) / (60 * 60 * 1000));
        return {
          allowed: false,
          reason: 'এই ইন্টারনেট কানেকশন থেকে ইতোমধ্যে অর্ডার করা হয়েছে। ২৪ ঘণ্টা পর আবার চেষ্টা করুন।',
          hoursRemaining
        };
      }
    }

    // Check 3: Same phone number within 24 hours
    const { data: phoneMatch, error: phoneError } = await supabase
      .from('order_fingerprints')
      .select('created_at')
      .eq('phone', phone)
      .gte('created_at', cutoffISO)
      .order('created_at', { ascending: false })
      .limit(1);

    if (phoneError) {
      console.error('Phone check error:', phoneError);
    }

    if (phoneMatch && phoneMatch.length > 0) {
      const lastOrder = new Date(phoneMatch[0].created_at);
      const hoursRemaining = Math.ceil((lastOrder.getTime() + RATE_LIMIT_HOURS * 60 * 60 * 1000 - Date.now()) / (60 * 60 * 1000));
      return {
        allowed: false,
        reason: 'এই ফোন নম্বর থেকে ইতোমধ্যে অর্ডার করা হয়েছে। ২৪ ঘণ্টা পর আবার চেষ্টা করুন।',
        hoursRemaining
      };
    }

    // Check 4: Suspicious patterns - same screen resolution + timezone + language combination
    const { data: patternMatch, error: patternError } = await supabase
      .from('order_fingerprints')
      .select('created_at, phone')
      .eq('screen_resolution', deviceInfo.screenResolution)
      .eq('timezone', deviceInfo.timezone)
      .eq('language', deviceInfo.language)
      .gte('created_at', cutoffISO);

    if (patternError) {
      console.error('Pattern check error:', patternError);
    }

    // If more than 3 orders with same device characteristics in 24h, block
    if (patternMatch && patternMatch.length >= 3) {
      return {
        allowed: false,
        reason: 'সন্দেহজনক কার্যকলাপ সনাক্ত হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
        hoursRemaining: 24
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Fraud prevention check error:', error);
    // Allow order if checks fail to avoid blocking legitimate customers
    return { allowed: true };
  }
};

export const recordOrderFingerprint = async (
  deviceInfo: DeviceInfo,
  phone: string,
  ipAddress: string | null
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('order_fingerprints')
      .insert({
        fingerprint: deviceInfo.fingerprint,
        ip_address: ipAddress,
        phone: phone,
        user_agent: deviceInfo.userAgent,
        screen_resolution: deviceInfo.screenResolution,
        timezone: deviceInfo.timezone,
        language: deviceInfo.language
      });

    if (error) {
      console.error('Failed to record fingerprint:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Record fingerprint error:', error);
    return false;
  }
};
