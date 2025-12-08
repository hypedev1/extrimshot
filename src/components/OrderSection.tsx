import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CreditCard, Lock, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { trackInitiateCheckout, trackPurchase, trackPixelEvent } from '@/lib/fbPixel';
import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint';
import { checkFraudPrevention, recordOrderFingerprint, getClientIP } from '@/lib/fraudPrevention';

export const OrderSection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { deviceInfo, isLoading: isFingerprintLoading } = useDeviceFingerprint();
  const [clientIP, setClientIP] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fraudBlock, setFraudBlock] = useState<{ blocked: boolean; reason?: string; hoursRemaining?: number }>({ blocked: false });
  const incompleteOrderIdRef = useRef<string | null>(null);
  const phoneTrackedRef = useRef<string | null>(null);

  // Get client IP on mount
  useEffect(() => {
    getClientIP().then(setClientIP);
  }, []);

  // Track InitiateCheckout when user scrolls to order section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackInitiateCheckout(1250);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    const section = document.getElementById('order');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  // Track incomplete order when phone number is entered
  const handlePhoneBlur = async () => {
    const phone = formData.phone.trim();
    if (phone.length >= 10 && phone !== phoneTrackedRef.current) {
      phoneTrackedRef.current = phone;
      try {
        const { data, error } = await supabase
          .from('incomplete_orders')
          .upsert(
            { 
              phone, 
              customer_name: formData.name.trim() || null,
              address: formData.address.trim() || null
            },
            { onConflict: 'phone' }
          )
          .select()
          .single();
        
        if (!error && data) {
          incompleteOrderIdRef.current = data.id;
        }
      } catch (err) {
        console.error('Failed to track incomplete order:', err);
      }
    }
  };

  // Update incomplete order when other fields change
  const updateIncompleteOrder = async () => {
    if (incompleteOrderIdRef.current) {
      try {
        await supabase
          .from('incomplete_orders')
          .update({
            customer_name: formData.name.trim() || null,
            address: formData.address.trim() || null
          })
          .eq('id', incompleteOrderIdRef.current);
      } catch (err) {
        console.error('Failed to update incomplete order:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFraudBlock({ blocked: false });

    console.log('Submitting order...', formData);

    // Fraud prevention check
    if (deviceInfo) {
      const fraudCheck = await checkFraudPrevention(
        deviceInfo,
        formData.phone.trim(),
        clientIP
      );

      if (!fraudCheck.allowed) {
        setFraudBlock({
          blocked: true,
          reason: fraudCheck.reason,
          hoursRemaining: fraudCheck.hoursRemaining
        });
        setIsSubmitting(false);
        toast({
          variant: 'destructive',
          title: 'অর্ডার করা সম্ভব হয়নি',
          description: fraudCheck.reason
        });
        return;
      }
    }

    try {
      const orderData = {
        customer_name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        total_amount: 1250,
        status: 'pending'
      };
      
      console.log('Order data:', orderData);
      
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Record fingerprint after successful order
      if (deviceInfo) {
        await recordOrderFingerprint(deviceInfo, formData.phone.trim(), clientIP);
      }

      // Track Purchase event on both browser and server
      try {
        await trackPurchase(
          { phone: formData.phone, name: formData.name },
          1250,
          data.id
        );

        // Also track Lead event
        trackPixelEvent('Lead', {
          value: 1250,
          currency: 'BDT',
        });
      } catch (trackError) {
        console.error('Tracking error:', trackError);
        // Don't block navigation on tracking errors
      }

      // Remove from incomplete orders after successful order
      if (incompleteOrderIdRef.current) {
        await supabase
          .from('incomplete_orders')
          .delete()
          .eq('id', incompleteOrderIdRef.current);
      } else if (formData.phone.trim()) {
        // Also try to delete by phone number
        await supabase
          .from('incomplete_orders')
          .delete()
          .eq('phone', formData.phone.trim());
      }

      navigate('/thank-you');
    } catch (error: any) {
      console.error('Order error:', error);
      toast({
        variant: 'destructive',
        title: 'ত্রুটি হয়েছে',
        description: error.message || 'অর্ডার সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <section id="order" className="py-16 px-4 bg-gradient-to-b from-card/50 to-background">
      <div className="container max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full mb-4">
            <Clock className="w-4 h-4" />
            <span className="font-semibold">স্পেশাল অফার – শুধুমাত্র আজকের জন্য!</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold mb-2">
            আজকের স্পেশাল অফার – স্টক সীমিত!
          </h2>
        </div>

        <div className="card-glass p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Pricing */}
            <div className="flex-1 text-center md:text-left">
              <p className="text-muted-foreground mb-1">নিয়মিত মূল্য</p>
              <p className="text-2xl text-muted-foreground line-through mb-4">২৫০০ টাকা</p>
              
              <div className="inline-block bg-red/20 text-red px-3 py-1 rounded-full text-sm font-bold mb-4">
                ৫০% ছাড়
              </div>
              
              <p className="text-muted-foreground mb-1">আজকের বিশেষ অফার মূল্য</p>
              <p className="text-5xl font-bold text-gradient mb-4">১২৫০ টাকা</p>
              
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 inline-block">
                <p className="text-accent font-semibold">💰 আপনি সাশ্রয় করছেন ১২৫০ টাকা!</p>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-6">অর্ডার করতে নিচের ফর্মটি পূরণ করুন</h3>
              
              {fraudBlock.blocked && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-4 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-destructive font-medium">{fraudBlock.reason}</p>
                    {fraudBlock.hoursRemaining && (
                      <p className="text-sm text-muted-foreground mt-1">
                        অনুগ্রহ করে {fraudBlock.hoursRemaining} ঘণ্টা পর আবার চেষ্টা করুন।
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">আপনার নাম *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    onBlur={updateIncompleteOrder}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="আপনার পুরো নাম লিখুন"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">মোবাইল নাম্বার *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    onBlur={handlePhoneBlur}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">ডেলিভারি ঠিকানা *</label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    onBlur={updateIncompleteOrder}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                    placeholder="আপনার সম্পূর্ণ ঠিকানা লিখুন"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span>💳 পেমেন্ট: Cash on Delivery (হাতে পণ্য পেয়ে টাকা দিবেন)</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isFingerprintLoading || fraudBlock.blocked}
                  className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'প্রসেস হচ্ছে...' : isFingerprintLoading ? 'লোড হচ্ছে...' : 'অর্ডার কনফার্ম করুন'}
                </button>

                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>🔒 কোনো আগাম পেমেন্ট নয় – আগে পণ্য, তারপর পেমেন্ট। আপনার তথ্য ১০০% সিকিউর।</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
