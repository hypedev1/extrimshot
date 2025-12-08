import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

interface DeviceInfo {
  fingerprint: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

export const useDeviceFingerprint = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        
        setDeviceInfo({
          fingerprint: result.visitorId,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language
        });
      } catch (error) {
        console.error('Failed to get device fingerprint:', error);
        // Fallback fingerprint using available browser data
        const fallbackFingerprint = btoa(
          navigator.userAgent + 
          window.screen.width + 
          window.screen.height + 
          navigator.language +
          new Date().getTimezoneOffset()
        );
        
        setDeviceInfo({
          fingerprint: fallbackFingerprint,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language
        });
      } finally {
        setIsLoading(false);
      }
    };

    getFingerprint();
  }, []);

  return { deviceInfo, isLoading };
};
