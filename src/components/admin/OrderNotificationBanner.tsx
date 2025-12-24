import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Package, FileText, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'order' | 'incomplete';
  message: string;
  subMessage?: string;
  timestamp: Date;
}

export const OrderNotificationBanner = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const orderSoundRef = useRef<HTMLAudioElement | null>(null);
  const incompleteSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements
  useEffect(() => {
    // Preload the Shopify sale sound for orders
    orderSoundRef.current = new Audio('/sounds/shopify-sale.mp3');
    orderSoundRef.current.preload = 'auto';
    
    // Create a softer notification sound for incomplete orders
    incompleteSoundRef.current = new Audio('/sounds/shopify-sale.mp3');
    incompleteSoundRef.current.preload = 'auto';
    incompleteSoundRef.current.volume = 0.4;
    incompleteSoundRef.current.playbackRate = 1.3;
    
    return () => {
      orderSoundRef.current = null;
      incompleteSoundRef.current = null;
    };
  }, []);

  // Play Shopify sale sound
  const playOrderSound = () => {
    if (!soundEnabled || !orderSoundRef.current) return;
    
    try {
      orderSoundRef.current.currentTime = 0;
      orderSoundRef.current.volume = 0.8;
      orderSoundRef.current.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
      console.error('Audio playback failed:', e);
    }
  };

  // Play softer notification sound for incomplete orders
  const playIncompleteSound = () => {
    if (!soundEnabled) return;
    
    try {
      // Create a quick soft beep for incomplete orders
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const duration = 0.3;
      const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
          const t = i / ctx.sampleRate;
          const freq = 880; // A5 note
          const envelope = Math.exp(-t * 10) * Math.sin(Math.PI * t / duration);
          data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
        }
      }
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      source.onended = () => ctx.close();
    } catch (e) {
      console.error('Audio playback failed:', e);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 5));
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 10000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    // Subscribe to new orders
    const ordersChannel = supabase
      .channel('order-banner-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🛒 New order notification:', payload);
          const order = payload.new as any;
          
          addNotification({
            type: 'order',
            message: `নতুন অর্ডার: ${order.customer_name}`,
            subMessage: `৳${order.total_amount} - ${order.phone}`
          });
          
          playOrderSound();
        }
      )
      .subscribe();

    // Subscribe to incomplete orders
    const incompleteChannel = supabase
      .channel('incomplete-banner-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'incomplete_orders'
        },
        (payload) => {
          console.log('📝 Incomplete order notification:', payload);
          const order = payload.new as any;
          
          addNotification({
            type: 'incomplete',
            message: 'Incomplete Order Started',
            subMessage: order.phone
          });
          
          playIncompleteSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(incompleteChannel);
    };
  }, [soundEnabled]);

  return (
    <>
      {/* Sound toggle button */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className={`fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all ${
          soundEnabled 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-muted-foreground'
        }`}
        title={soundEnabled ? 'Sound On' : 'Sound Off'}
      >
        <Volume2 className={`w-5 h-5 ${!soundEnabled ? 'opacity-50' : ''}`} />
      </button>

      {/* Notification banners */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`relative overflow-hidden rounded-xl shadow-2xl ${
                notification.type === 'order'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              
              <div className="relative p-4 flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  notification.type === 'order' ? 'bg-white/20' : 'bg-white/20'
                }`}>
                  {notification.type === 'order' ? (
                    <Package className="w-6 h-6 text-white" />
                  ) : (
                    <FileText className="w-6 h-6 text-white" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">
                    {notification.type === 'order' ? '🎉 ' : '📝 '}
                    {notification.message}
                  </p>
                  {notification.subMessage && (
                    <p className="text-white/90 text-xs mt-0.5 truncate">
                      {notification.subMessage}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="h-1 bg-white/30">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 10, ease: 'linear' }}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};
