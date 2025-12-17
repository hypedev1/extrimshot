import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, CreditCard, Lock, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { trackInitiateCheckout, trackPurchase, trackPixelEvent } from '@/lib/fbPixel';
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

  useEffect(() => {
    getClientIP().then(setClientIP);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackInitiateCheckout(selectedPackage.price);
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

      try {
        await trackPurchase(
          { phone: formData.phone, name: formData.name },
          selectedPackage.price,
          orderResult.id
        );

        trackPixelEvent('Lead', {
          value: selectedPackage.price,
          currency: 'BDT',
        });
      } catch (trackError) {
        console.error('Tracking error:', trackError);
      }

      if (incompleteOrderIdRef.current) {
        await supabase
          .from('incomplete_orders')
          .delete()
          .eq('id', incompleteOrderIdRef.current);
      } else if (formData.phone.trim()) {
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
            {data.title}
          </h2>
          <p className="text-muted-foreground">{data.subtitle}</p>
        </div>

        <div className="card-glass p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Package Selection */}
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-4 text-center md:text-left">প্যাকেজ নির্বাচন করুন</h3>
              <div className="space-y-3">
                {data.packages.map((pkg) => (
                  <div 
                    key={pkg.id}
                    onClick={() => setFormData({ ...formData, packageType: pkg.id })}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                      formData.packageType === pkg.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.packageType === pkg.id ? 'border-primary' : 'border-muted-foreground'
                      }`}>
                        {formData.packageType === pkg.id && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{pkg.name}</p>
                        <p className="text-sm text-muted-foreground">{pkg.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">৳{pkg.price}</p>
                        <p className="text-sm line-through text-muted-foreground">৳{pkg.originalPrice}</p>
                      </div>
                    </div>
                    {pkg.popular && (
                      <div className="mt-2 ml-8">
                        <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">সবচেয়ে জনপ্রিয়</span>
                      </div>
                    )}
                    {pkg.savings && (
                      <div className="mt-1 ml-8 text-xs text-accent">{pkg.savings}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-accent/10 border border-accent/30 rounded-xl p-4 text-center">
                <p className="text-accent font-semibold">💰 নির্বাচিত প্যাকেজ: ৳{selectedPackage.price}</p>
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
                  <label className="block text-sm font-medium mb-2">সম্পূর্ণ ঠিকানা *</label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    onBlur={updateIncompleteOrder}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                    placeholder="বাড়ি/ফ্ল্যাট নং, রাস্তার নাম, এলাকা, শহর"
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
