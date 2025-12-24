import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Shopify-like notification sound (base64 encoded)
const ORDER_SOUND_URL = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYK6+VJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

// Different sound for incomplete orders (softer notification)
const INCOMPLETE_ORDER_SOUND_URL = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYK6+VJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

interface OrderNotification {
  id: string;
  type: 'order' | 'incomplete';
  customerName?: string;
  phone: string;
  amount?: number;
  timestamp: Date;
}

export const useOrderNotifications = (enabled: boolean = true) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const orderSoundBufferRef = useRef<AudioBuffer | null>(null);
  const incompleteSoundBufferRef = useRef<AudioBuffer | null>(null);

  // Initialize audio context and load sounds
  const initAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;

    // Create a more prominent "ka-ching" sound for orders
    const createOrderSound = () => {
      const sampleRate = ctx.sampleRate;
      const duration = 0.8;
      const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          // Multiple harmonics for rich "ka-ching" sound
          const freq1 = 1200 + (channel * 50);
          const freq2 = 1800 + (channel * 50);
          const freq3 = 2400 + (channel * 50);
          
          const envelope = Math.exp(-t * 4) * Math.sin(Math.PI * t / duration);
          
          data[i] = (
            Math.sin(2 * Math.PI * freq1 * t) * 0.4 +
            Math.sin(2 * Math.PI * freq2 * t) * 0.3 +
            Math.sin(2 * Math.PI * freq3 * t) * 0.2
          ) * envelope;
          
          // Add second "ching" at 0.15s
          if (t > 0.15 && t < 0.5) {
            const t2 = t - 0.15;
            const envelope2 = Math.exp(-t2 * 5);
            data[i] += (
              Math.sin(2 * Math.PI * (freq1 * 1.5) * t2) * 0.3 +
              Math.sin(2 * Math.PI * (freq2 * 1.5) * t2) * 0.2
            ) * envelope2;
          }
        }
      }
      return buffer;
    };

    // Create a softer notification sound for incomplete orders
    const createIncompleteSound = () => {
      const sampleRate = ctx.sampleRate;
      const duration = 0.5;
      const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const freq = 800 + (channel * 20);
          const envelope = Math.exp(-t * 6) * Math.sin(Math.PI * t / duration);
          
          data[i] = (
            Math.sin(2 * Math.PI * freq * t) * 0.5 +
            Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.25
          ) * envelope * 0.6;
        }
      }
      return buffer;
    };

    orderSoundBufferRef.current = createOrderSound();
    incompleteSoundBufferRef.current = createIncompleteSound();
  }, []);

  const playSound = useCallback(async (type: 'order' | 'incomplete') => {
    if (!audioContextRef.current) {
      await initAudio();
    }

    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const buffer = type === 'order' ? orderSoundBufferRef.current : incompleteSoundBufferRef.current;
    if (!buffer) {
      await initAudio();
      return playSound(type);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = ctx.createGain();
    gainNode.gain.value = type === 'order' ? 0.7 : 0.4;
    
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();
  }, [initAudio]);

  const showNotification = useCallback((notification: OrderNotification) => {
    if (notification.type === 'order') {
      toast({
        title: "🛒 নতুন অর্ডার এসেছে!",
        description: `${notification.customerName || 'Customer'} - ৳${notification.amount || 0}`,
        duration: 8000,
      });
    } else {
      toast({
        title: "📝 Incomplete Order",
        description: `${notification.phone} - Form started`,
        duration: 5000,
      });
    }
    playSound(notification.type);
  }, [playSound]);

  useEffect(() => {
    if (!enabled) return;

    // Initialize audio on first user interaction
    const handleInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);

    // Subscribe to new orders
    const ordersChannel = supabase
      .channel('admin-orders-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order received:', payload);
          const order = payload.new as any;
          showNotification({
            id: order.id,
            type: 'order',
            customerName: order.customer_name,
            phone: order.phone,
            amount: order.total_amount,
            timestamp: new Date(order.created_at)
          });
        }
      )
      .subscribe();

    // Subscribe to incomplete orders
    const incompleteChannel = supabase
      .channel('admin-incomplete-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'incomplete_orders'
        },
        (payload) => {
          console.log('New incomplete order:', payload);
          const order = payload.new as any;
          showNotification({
            id: order.id,
            type: 'incomplete',
            customerName: order.customer_name,
            phone: order.phone,
            timestamp: new Date(order.created_at)
          });
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener('click', handleInteraction);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(incompleteChannel);
    };
  }, [enabled, showNotification, initAudio]);

  return { playSound, showNotification };
};
