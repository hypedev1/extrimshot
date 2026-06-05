import { supabase } from '@/integrations/supabase/client';

export const BLOCKED_PHONE_MESSAGE =
  'This phone number has been blocked. Please contact support.';

/**
 * Globally checks whether a phone number is on the admin-managed blocklist.
 * Safe to call from public (unauthenticated) contexts — uses a SECURITY DEFINER RPC.
 */
export const isPhoneBlocked = async (phone: string): Promise<boolean> => {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  try {
    const { data, error } = await supabase.rpc('is_phone_blocked', { _phone: trimmed });
    if (error) {
      console.warn('Blocklist check failed:', error.message);
      return false;
    }
    return !!data;
  } catch (e) {
    console.warn('Blocklist check error:', e);
    return false;
  }
};
