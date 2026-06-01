import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, CreditCard, Lock, ShieldAlert, Check, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { trackInitiateCheckout, trackPurchase, trackPixelEvent, trackIncompletePurchase } from '@/lib/fbPixel';
import { trackTtInitiateCheckout, trackTtCompletePayment, trackTtIncompletePurchase } from '@/lib/tiktokPixel';
import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint';
import { checkFraudPrevention, recordOrderFingerprint, getClientIP, recordBlockedAttempt } from '@/lib/fraudPrevention';

interface OrderPackage {
  id: string;
  name: string;
  quantity: string;
  price: number;
  originalPrice: number;
  popular?: boolean;
  savings?: string;
}

interface OrderContent {
  title: string;
  subtitle: string;
  packages: OrderPackage[];
}

interface OrderSectionProps {
  content?: OrderContent;
}

export const OrderSection = ({ content }: OrderSectionProps) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { deviceInfo, isLoading: isFingerprintLoading } = useDeviceFingerprint();
  const [clientIP, setClientIP] = useState<string | null>(null);

  const defaultContent: OrderContent = {
    title: 'আজই অর্ডার করুন',
    subtitle: 'সীমিত সময়ের জন্য বিশেষ অফার',
    packages: [
      { id: 'regular', name: 'রেগুলার কোর্স (৯০ গ্রাম)', quantity: '১৫ দিনের জন্য', price: 1250, originalPrice: 2500, savings: '৫০% সেভ' },
      { id: 'permanent', name: 'পার্মানেন্ট কোর্স (১৮০ গ্রাম)', quantity: '৩০ দিনের জন্য', price: 1950, originalPrice: 3900, popular: true, savings: '৫০% সেভ' }
    ]
  };

  const data = content || defaultContent;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    packageType: data.packages.find(p => p.popular)?.id || data.packages[0]?.id || 'regular'
  });

  const selectedPackage = data.packages.find(p => p.id === formData.packageType) || data.packages[0];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fraudBlock, setFraudBlock] = useState<{ blocked: boolean; reason?: string; hoursRemaining?: number }>({ blocked: false });
  const incompleteOrderIdRef = useRef<string | null>(null);
  const phoneTrackedRef = useRef<string | null>(null);

  // ⚡ Defer IP fetch — only needed when user submits, not on every page load
  // Called lazily on first form interaction (phone blur)
  const fetchClientIPOnce = async () => {
    if (clientIP !== null) return; // Already fetched
    const ip = await getClientIP();
    setClientIP(ip);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackInitiateCheckout(selectedPackage.price);
            trackTtInitiateCheckout(selectedPackage.price);
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

  const handlePhoneBlur = async () => {
    // Start fetching IP in background as soon as user touches the phone field
    fetchClientIPOnce();
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
          
          // Send Purchase event to Facebook + TikTok for incomplete orders
          try {
            await trackIncompletePurchase(
              { phone, name: formData.name.trim() || undefined },
              selectedPackage.price,
              data.id
            );
            await trackTtIncompletePurchase({ phone, name: formData.name.trim() || undefined }, selectedPackage.price, data.id);
          } catch (trackError) {
            console.error('Failed to track incomplete purchase:', trackError);
          }
        }
      } catch (err) {
        console.error('Failed to track incomplete order:', err);
      }
    }
  };

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

    if (!deviceInfo) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি হয়েছে',
        description: 'ডিভাইস যাচাই করা যায়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।'
      });
      setIsSubmitting(false);
      return;
    }

    const fraudCheck = await checkFraudPrevention(
      deviceInfo,
      formData.phone.trim(),
      clientIP
    );

    if (!fraudCheck.allowed) {
      await recordBlockedAttempt(
        { name: formData.name.trim(), phone: formData.phone.trim(), address: formData.address.trim() },
        deviceInfo,
        clientIP,
        fraudCheck.reason || 'Unknown reason'
      );
      
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

    try {
      const fingerprintRecorded = await recordOrderFingerprint(deviceInfo, formData.phone.trim(), clientIP);
      
      if (!fingerprintRecorded) {
        toast({
          variant: 'destructive',
          title: 'ত্রুটি হয়েছে',
          description: 'অর্ডার প্রসেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
        });
        setIsSubmitting(false);
        return;
      }

      const productName = slug || 'powerbooster';
      const orderData = {
        customer_name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        total_amount: selectedPackage.price,
        package_type: `${productName}-${formData.packageType}`,
        status: 'pending',
      };
      
      const { data: orderResult, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;

      // Fire-and-forget: don't block order completion on tracking calls
      if (!incompleteOrderIdRef.current) {
        trackPurchase(
          { phone: formData.phone, name: formData.name },
          selectedPackage.price,
          orderResult.id
        ).catch(e => console.error('FB tracking error:', e));
      }
      trackTtCompletePayment(
        { phone: formData.phone, name: formData.name },
        selectedPackage.price,
        orderResult.id
      ).catch(e => console.error('TikTok tracking error:', e));

      // Clean up incomplete orders (fire-and-forget)
      if (incompleteOrderIdRef.current) {
        supabase.from('incomplete_orders').delete().eq('id', incompleteOrderIdRef.current).then();
      } else if (formData.phone.trim()) {
        supabase.from('incomplete_orders').delete().eq('phone', formData.phone.trim()).then();
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

  const benefits = [
    { icon: Check, text: '১০০% প্রাকৃতিক উপাদান' },
    { icon: Truck, text: 'সারা বাংলাদেশে ফ্রি ডেলিভারি' },
    { icon: Lock, text: 'ক্যাশ অন ডেলিভারি' }
  ];

  return (
    <section id="order" className="py-16 md:py-24 px-4 bg-gradient-to-b from-card to-teal-light/30">
      <div className="container max-w-5xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2 rounded-full mb-4 shadow-lg">
            <Clock className="w-4 h-4" />
            <span className="font-semibold">স্পেশাল অফার – শুধুমাত্র আজকের জন্য!</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-2">
            {data.title}
          </h2>
          <p className="text-muted-foreground">{data.subtitle}</p>
        </div>

        <div className="bg-background rounded-3xl shadow-xl border border-border overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Package Selection */}
            <div className="flex-1 p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-border">
              <h3 className="text-xl font-bold mb-6 text-foreground">প্যাকেজ নির্বাচন করুন</h3>
              <div className="space-y-4">
                {data.packages.map((pkg) => (
                  <div 
                    key={pkg.id}
                    onClick={() => setFormData({ ...formData, packageType: pkg.id })}
                    className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${
                      formData.packageType === pkg.id 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        formData.packageType === pkg.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                      }`}>
                        {formData.packageType === pkg.id && (
                          <Check className="w-4 h-4 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{pkg.name}</p>
                        <p className="text-sm text-muted-foreground">{pkg.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">৳{pkg.price}</p>
                        <p className="text-sm line-through text-muted-foreground">৳{pkg.originalPrice}</p>
                      </div>
                    </div>
                    {(pkg.popular || pkg.savings) && (
                      <div className="mt-3 ml-10 flex gap-2">
                        {pkg.popular && (
                          <span className="text-xs bg-accent text-accent-foreground px-3 py-1 rounded-full font-medium">সবচেয়ে জনপ্রিয়</span>
                        )}
                        {pkg.savings && (
                          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{pkg.savings}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Benefits */}
              <div className="mt-6 space-y-3">
                {benefits.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-muted-foreground">
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 p-6 md:p-8 bg-card/50">
              <h3 className="text-xl font-bold mb-6 text-foreground">অর্ডার করতে ফর্মটি পূরণ করুন</h3>
              
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
                  <label className="block text-sm font-medium mb-2 text-foreground">আপনার নাম *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    onBlur={updateIncompleteOrder}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="আপনার পুরো নাম লিখুন"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">মোবাইল নাম্বার *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    onBlur={handlePhoneBlur}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">সম্পূর্ণ ঠিকানা *</label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    onBlur={updateIncompleteOrder}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none text-foreground"
                    rows={3}
                    placeholder="বাড়ি/ফ্ল্যাট নং, রাস্তার নাম, এলাকা, শহর"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 rounded-xl p-4 border border-primary/10">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span>পেমেন্ট: Cash on Delivery (হাতে পণ্য পেয়ে টাকা দিবেন)</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isFingerprintLoading || fraudBlock.blocked}
                  className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'প্রসেস হচ্ছে...' : isFingerprintLoading ? 'লোড হচ্ছে...' : `অর্ডার কনফার্ম করুন - ৳${selectedPackage.price}`}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span>আপনার তথ্য ১০০% সিকিউর</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};