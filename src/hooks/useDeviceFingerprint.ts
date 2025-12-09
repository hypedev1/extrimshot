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
      // Helper to create fallback fingerprint
      const createFallbackInfo = (): DeviceInfo => {
        const screenWidth = window.screen?.width || 0;
        const screenHeight = window.screen?.height || 0;
        const lang = navigator.language || 'en';
        const ua = navigator.userAgent || 'unknown';
        
        let timezone = 'Unknown';
        try {
          timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
          timezone = String(new Date().getTimezoneOffset());
        }
        
        // Create fallback fingerprint without btoa (which can fail on some characters)
        const fallbackData = `${ua}-${screenWidth}-${screenHeight}-${lang}-${new Date().getTimezoneOffset()}`;
        const fallbackFingerprint = fallbackData.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0).toString(36);
        
        return {
          fingerprint: `fallback_${fallbackFingerprint}`,
          userAgent: ua,
          screenResolution: `${screenWidth}x${screenHeight}`,
          timezone,
          language: lang
        };
      };

      try {
        // Add timeout for FingerprintJS loading
        const loadPromise = FingerprintJS.load();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Fingerprint timeout')), 8000)
        );
        
        const fp = await Promise.race([loadPromise, timeoutPromise]);
        const result = await fp.get();
        
        let timezone = 'Unknown';
        try {
          timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
          timezone = String(new Date().getTimezoneOffset());
        }
        
        setDeviceInfo({
          fingerprint: result.visitorId,
          userAgent: navigator.userAgent || 'unknown',
          screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
          timezone,
          language: navigator.language || 'en'
        });
      } catch (error) {
        console.warn('Fingerprint fallback used:', error);
        setDeviceInfo(createFallbackInfo());
      } finally {
        setIsLoading(false);
      }
    };

    // Wrap in try-catch to ensure component always renders
    try {
      getFingerprint();
    } catch (error) {
      console.error('Critical fingerprint error:', error);
      setIsLoading(false);
    }
  }, []);

  return { deviceInfo, isLoading };
};
